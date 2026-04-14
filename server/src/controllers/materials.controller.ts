import type { Request, Response } from 'express';
import * as materialsService from '../services/materials.service.js';

export async function list(_req: Request, res: Response) {
  const materials = await materialsService.listGlobalMaterials();
  return res.json(materials);
}
