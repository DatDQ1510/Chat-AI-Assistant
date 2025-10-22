-- Up Migration: thêm cột attachments (JSONB) vào bảng messages
ALTER TABLE messages
ADD COLUMN attachments JSONB NULL;

-- Down Migration: rollback - xóa cột attachments
-- (nếu dùng thủ công, chỉ cần bỏ comment đoạn này khi rollback)
-- ALTER TABLE messages DROP COLUMN attachments;
