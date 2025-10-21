
class socketService {
    
    async sendMessageToRoom(io: any, room: string, event: string, message: any) {
        io.to(room).emit(event, message);
    }
}