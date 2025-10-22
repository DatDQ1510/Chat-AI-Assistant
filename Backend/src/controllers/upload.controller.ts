import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import { Readable } from "stream";
import { url } from "inspector";


export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("File upload request received");    
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const stream = cloudinary.uploader.upload_stream(
        {
            folder: "uploads",
            resource_type: "auto",
            type: "upload"
        },
        (error, result) => {
            if (error) {
                return next(error);
            }
            res.status(200).json(
                {
                    message: "File uploaded successfully",
                    url: result?.secure_url,
                    public_id: result?.public_id,
                    resource_type: result?.resource_type
                });
        })

        Readable.from(file.buffer).pipe(stream);
    } catch (error) {
        next(error);
    }   
};