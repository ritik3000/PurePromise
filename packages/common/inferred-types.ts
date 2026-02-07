import { z } from "zod";
import {TrainModel, GenerateImage, GenerateImagesFromPack, GeneratePackWithImages} from "./types";

export type TrainModelInput = z.infer<typeof TrainModel>;
export type GenerateImageInput = z.infer<typeof GenerateImage>;
export type GenerateImagesFromPackInput = z.infer<typeof GenerateImagesFromPack>;
export type GeneratePackWithImagesInput = z.infer<typeof GeneratePackWithImages>;
