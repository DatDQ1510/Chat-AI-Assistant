    // src/services/memory.service.ts
    import { sequelize } from '../config/database.js';
    import { embeddingService } from './embedding.service.js';
    import { cosineSimilarity } from '../utils/cosineSimilarity.js';

    interface Memory {
      id: string;
      user_id: string;
      type: string;
      content: string;
      embedding: number[] | null;
      importance: number;
      createdAt: Date;
      updatedAt: Date;
      similarity?: number; // For search results
    }

    export const memoryService = {
      /**
       * Tìm kiếm memories liên quan đến câu hỏi của user bằng semantic search
       * @param userId - ID của user
       * @param query - Câu hỏi hoặc nội dung cần tìm
       * @param limit - Số lượng memories tối đa trả về
       * @param minSimilarity - Ngưỡng similarity tối thiểu (0-1)
       * @returns Danh sách memories liên quan kèm similarity score
       */
      async searchRelevantMemories(
        userId: string,
        query: string,
        limit: number = 5,
        // minSimilarity: number = 0.5
      ): Promise<Memory[]> {
        try {
          // 1. Generate embedding cho query
          const queryEmbedding = await embeddingService.generateEmbedding(query);
          if (!queryEmbedding) {
            console.warn('⚠️ Could not generate embedding for query');
            return [];
          }

          // 2. Fetch tất cả memories có embedding của user
          const sqlQuery = `
            SELECT 
              id, 
              user_id, 
              type, 
              content, 
              embedding, 
              importance, 
              "createdAt", 
              "updatedAt"
            FROM "user_memories"
            WHERE user_id = $1 
              AND embedding IS NOT NULL
            ORDER BY "createdAt" DESC;
          `;

          const [memories]: any = await sequelize.query(sqlQuery, {
            bind: [userId],
          });

          if (!memories || memories.length === 0) {
            console.log(`No memories found for user ${userId}`);
            return [];
          }

          // 3. Tính similarity cho từng memory
          const memoriesWithScore: Memory[] = memories.map((mem: any) => {
            // Parse embedding từ string "[1,2,3]" thành array
            let embedding: number[] = [];
            if (typeof mem.embedding === 'string') {
              embedding = JSON.parse(mem.embedding);
            } else if (Array.isArray(mem.embedding)) {
              embedding = mem.embedding;
            }

            const similarity = cosineSimilarity(queryEmbedding, embedding);

            return {
              id: mem.id,
              user_id: mem.user_id,
              type: mem.type,
              content: mem.content,
              embedding,
              importance: mem.importance,
              createdAt: mem.createdAt,
              updatedAt: mem.updatedAt,
              similarity,
            };
          });

          // 4. Filter theo minSimilarity và sort theo similarity giảm dần
          const relevantMemories = memoriesWithScore
            // .filter((mem) => (mem.similarity ?? 0) >= minSimilarity)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, limit);

          console.log(
            `🧠 Found ${relevantMemories.length} relevant memories )`
          );

          return relevantMemories;
        } catch (error: any) {
          console.error('❌ Error searching memories:', error);
          return [];
        }
      },

      /**
       * Kiểm tra xem query có liên quan đến thông tin cá nhân không
       * @param query - Câu hỏi của user
       * @returns true nếu câu hỏi liên quan đến user
       */
      isPersonalQuery(query: string): boolean {
        const personalKeywords = [
          // Vietnamese
          'tôi', 'mình', 'của tôi', 'của mình', 'sở thích', 'thích gì',
          'làm gì', 'công việc', 'sống ở đâu', 'tên tôi', 'là ai',
          'bản thân', 'về tôi', 'nhớ', 'biết về tôi',
          // English
          'my', 'me', 'i like', 'i am', 'who am i', 'remember me',
          'about me', 'my name', 'my job', 'my hobby', 'do you know me',
        ];

        const lowerQuery = query.toLowerCase();
        return personalKeywords.some((keyword) => lowerQuery.includes(keyword));
      },

      /**
       * Format memories thành text để thêm vào prompt
       * @param memories - Danh sách memories
       * @returns Formatted string
       */
      formatMemoriesForPrompt(memories: Memory[]): string {
        if (memories.length === 0) return '';

        const factsText = memories
          .map((mem, index) => {
            const score = mem.similarity ? `(${(mem.similarity * 100).toFixed(1)}%)` : '';
            return `Memory ${index + 1} ${score}: ${mem.content}`;
          })
          .join('\n');

        return `\n\nRelevant information about the user:\n${factsText}\n`;
      },

      /**
       * Xác định xem câu của user có đang hỏi về bản thân không
       * => chỉ nên TRUY VẤN memory
       */
      isPersonalQuestion(query: string): boolean {
        const lower = query.toLowerCase();
        const questionPatterns = [
          /tên (của )?tôi là gì/,
          /tôi là ai/,
          /tôi thích gì/,
          /tôi làm gì/,
          /tôi sống ở đâu/,
          /tôi bao nhiêu tuổi/,
          /tôi là ai/,
          /my name/,
          /who am i/,
          /what do i like/,
          /where do i live/,
          /how old am i/,
        ];
        return questionPatterns.some((p) => p.test(lower));
      },

      /**
       * Xác định xem câu của user có đang CUNG CẤP thông tin về bản thân không
       * => chỉ nên LƯU memory
       */
      isPersonalStatement(query: string): boolean {
        const lower = query.toLowerCase();
        const statementPatterns = [
          /tên tôi là/,
          /tôi tên là/,
          /tôi thích/,
          /tôi sống ở/,
          /tôi làm việc ở/,
          /tôi đang học/,
          /tôi đang nghiên cứu/,
          /tôi đang làm việc/,
          /tôi đã làm việc/,
          /tôi đã nghiên cứu/,
          /tôi học ở/,
          /tôi làm ở/,
          /tôi đã học ở/,
          /tôi là sinh viên/,
          /nhớ về tôi/,
          /sở thích của tôi là/,
          /công việc của tôi là/,
          /my name is/,
          /i live in/,
          /i work at/,
          /i like/,
          /i am a/,
          /i'm a/,
          /i study at/,
          /i am studying at/,
          /i have worked at/,
          /i have studied at/,
          /remember me/,
          /My hobby is/,
          /My job is/,
          /My profession is/,   
          /My favorite is/,
        ];
        return statementPatterns.some((p) => p.test(lower));
      },

    };

    export default memoryService;
