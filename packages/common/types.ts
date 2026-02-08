import { z } from "zod";

export const TrainModel = z.object({
    name: z.string(),
    type: z.enum(["Man", "Woman", "Others"]),
    age: z.number(),
    ethinicity: z.enum(["White", 
        "Black", 
        "Asian_American", 
        "East_Asian",
        "South_East_Asian", 
        "South_Asian", 
        "Middle_Eastern", 
        "Pacific", 
        "Hispanic"
    ]),
    eyeColor: z.enum(["Brown", "Blue", "Hazel", "Gray"]),
    bald: z.boolean(),
    zipUrl: z.string()
})

export const GenerateImage = z.object({
    prompt: z.string(),
    modelId: z.string(),
    num: z.number()
})

export const GenerateImagesFromPack = z.object({
    modelId: z.string(),
    packId: z.string()
});

/** Pack generation using uploaded couple images (5–10) with Seedream 4.5 */
export const GeneratePackWithImages = z.object({
    packId: z.string(),
    imageUrls: z.array(z.string().url()).min(5).max(10),
});

/** Single image generation from reference images (5–10) with Seedream 4.5 */
export const GenerateImageFromReference = z.object({
    prompt: z.string().min(1),
    imageUrls: z.array(z.string().url()).min(5).max(10),
});