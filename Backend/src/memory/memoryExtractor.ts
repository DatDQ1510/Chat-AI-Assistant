export const memoryExtractor = {
    extractFactsFromMessage(message: string): string[] {
        const facts: string[] = [];

        const patterns = [
        // sở thích
        /(tôi|mình)\s+(rất\s+)?(thích|yêu)\s+([^.,!?]+)/i,

        // công việc hoặc dự án
        /(tôi|mình)\s+(đang\s+)?(làm|làm việc tại|thực hiện|xây dựng)\s+([^.,!?]+)/i,
        /(dự án|project)\s+(hiện tại|của tôi)\s*(là|:)\s*([^.,!?]+)/i,

        // nơi sống
        /(tôi|mình)\s+(sống ở|đang ở|hiện tại ở)\s+([^.,!?]+)/i,

        // thông tin cá nhân
        /(tôi tên|tên tôi|my name is)\s+([^.,!?]+)/i,
        /(tôi\s+là)\s+([^.,!?]+)/i,
        ];

        for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
            // nhóm cuối cùng chứa phần giá trị
            const fact = match[0].trim();
            facts.push(fact);
        }
        }

        return facts;
    },
};
