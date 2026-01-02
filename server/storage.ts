import { adminDb } from "./firebase";
import { type Settings, type Limits, type Workflow, type Content } from "@shared/schema";

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

export class FirebaseStorage implements IStorage {
  private settingsCol = adminDb.collection("settings");
  private limitsCol = adminDb.collection("limits");
  private workflowsCol = adminDb.collection("workflows");
  private contentCol = adminDb.collection("content");

  async getSettings() {
    const snapshot = await this.settingsCol.limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as Settings;
  }

  async updateSettings(data: any) {
    const existing = await this.getSettings();
    if (existing) {
      const snapshot = await this.settingsCol.limit(1).get();
      const doc = snapshot.docs[0];
      await doc.ref.update(data);
      return { ...doc.data(), ...data } as Settings;
    }
    const docRef = await this.settingsCol.add({ ...data, id: 1 });
    const doc = await docRef.get();
    return doc.data() as Settings;
  }

  async getLimits() {
    const snapshot = await this.limitsCol.limit(1).get();
    if (snapshot.empty) {
      const defaultLimits = {
        id: 1,
        textLimit: 100,
        imageLimit: 50,
        videoLimit: 10,
        textUsed: 0,
        imageUsed: 0,
        videoUsed: 0,
        lastResetDate: new Date().toISOString()
      };
      await this.limitsCol.add(defaultLimits);
      return defaultLimits as unknown as Limits;
    }
    const data = snapshot.docs[0].data();
    return {
      ...data,
      lastResetDate: new Date(data.lastResetDate)
    } as Limits;
  }

  async updateLimits(data: any) {
    const snapshot = await this.limitsCol.limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update(data);
      return { ...doc.data(), ...data } as Limits;
    }
    return this.getLimits();
  }

  async getWorkflows() {
    const snapshot = await this.workflowsCol.get();
    return snapshot.docs.map(doc => doc.data() as Workflow);
  }

  async updateWorkflow(id: number, enabled: boolean) {
    const snapshot = await this.workflowsCol.where("id", "==", id).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({ enabled });
      return { ...doc.data(), enabled } as Workflow;
    }
    throw new Error("Workflow not found");
  }

  async getContent() {
    const snapshot = await this.contentCol.get();
    return snapshot.docs.map(doc => doc.data() as Content);
  }

  async createContent(data: any) {
    const id = Date.now();
    const docRef = await this.contentCol.add({ ...data, id });
    const doc = await docRef.get();
    return doc.data() as Content;
  }

  async deleteContent(id: number) {
    const snapshot = await this.contentCol.where("id", "==", id).limit(1).get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
  }
}

export const storage = new FirebaseStorage();
