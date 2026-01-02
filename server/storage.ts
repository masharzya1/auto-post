import { db } from "./db";
import { settings, limits, workflows, content, type Settings, type Limits, type Workflow, type Content } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getSettings(): Promise<Settings | undefined>;
  updateSettings(data: any): Promise<Settings>;
  getLimits(): Promise<Limits | undefined>;
  updateLimits(data: any): Promise<Limits>;
  getWorkflows(): Promise<Workflow[]>;
  updateWorkflow(id: number, enabled: boolean): Promise<Workflow>;
  getContent(): Promise<Content[]>;
  createContent(data: any): Promise<Content>;
  deleteContent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSettings() {
    const [s] = await db.select().from(settings);
    return s;
  }
  async updateSettings(data: any) {
    const existing = await this.getSettings();
    if (existing) {
      const [updated] = await db.update(settings).set(data).where(eq(settings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(settings).values(data).returning();
    return created;
  }
  async getLimits() {
    const [l] = await db.select().from(limits);
    if (!l) {
      // Create default limits if none exist
      const [created] = await db.insert(limits).values({
        textLimit: 100,
        imageLimit: 50,
        videoLimit: 10,
        textUsed: 0,
        imageUsed: 0,
        videoUsed: 0,
        lastResetDate: new Date()
      }).returning();
      return created;
    }
    return l;
  }
  async updateLimits(data: any) {
    const existing = await this.getLimits();
    // existing is guaranteed to be defined because getLimits creates it if missing
    const [updated] = await db.update(limits).set(data).where(eq(limits.id, existing!.id)).returning();
    return updated;
  }
  async getWorkflows() {
    return await db.select().from(workflows);
  }
  async updateWorkflow(id: number, enabled: boolean) {
    const [updated] = await db.update(workflows).set({ enabled }).where(eq(workflows.id, id)).returning();
    return updated;
  }
  async getContent() {
    return await db.select().from(content);
  }
  async createContent(data: any) {
    const [created] = await db.insert(content).values(data).returning();
    return created;
  }
  async deleteContent(id: number) {
    await db.delete(content).where(eq(content.id, id));
  }
}

export const storage = new DatabaseStorage();
