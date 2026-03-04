import { BACKEND_URL } from "@/app/config";
import { TPack } from "./PackCard";
import axios from "axios";
import { PacksClient } from "./PacksClient";
import { auth } from "@clerk/nextjs/server";

async function getPacks(token: string | null): Promise<TPack[]> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await axios.get(`${BACKEND_URL}/pack/bulk`, { headers });
  return res.data.packs ?? [];
}

export async function Packs() {
  const { getToken } = await auth();
  const token = await getToken();
  const packs = await getPacks(token);

  return <PacksClient packs={packs} />;
}
