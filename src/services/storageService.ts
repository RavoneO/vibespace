
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { generateImageCaption } from './captionService';

export async function uploadFile(file: File, path: string, generateCaption: boolean = false): Promise<{ downloadURL: string, caption?: string }> {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        let caption: string | undefined = undefined;
        if (generateCaption) {
            try {
                caption = await generateImageCaption(downloadURL);
            } catch (captionError) {
                console.error("Error generating image caption:", captionError);
                // Silently fail on caption generation, as it's a non-critical feature.
            }
        }

        return { downloadURL, caption };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('File upload failed.');
    }
}
