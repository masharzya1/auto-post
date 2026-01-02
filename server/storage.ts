import { adminDb } from "./firebase-config.js";
import { type Settings, type Limits, type Workflow, type Content, type User } from "@shared/schema.js";

export interface IStorage {
  getSettings(): Promise<Settings | undefined>;
  updateSettings(data: any): Promise<Settings>;
  getLimits(): Promise<Limits | undefined>;
  updateLimits(data: any): Promise<Limits>;
  getWorkflows(): Promise<Workflow[]>;
  createWorkflow(data: any): Promise<Workflow>;
  updateWorkflow(id: number, enabled?: boolean, updates?: any): Promise<Workflow>;
  getContent(): Promise<Content[]>;
  getContentById(id: number): Promise<Content | undefined>;
  createContent(data: any): Promise<Content>;
  deleteContent(id: number): Promise<void>;
  getUserByFirebaseUid(uid: string): Promise<User | undefined>;
  createUser(data: any): Promise<User>;
  updateUser(id: number, updates: any): Promise<User>;
}

export class FirebaseStorage implements IStorage {
  private settingsCol = adminDb.collection("settings");
  private limitsCol = adminDb.collection("limits");
  private workflowsCol = adminDb.collection("workflows");
  private contentCol = adminDb.collection("content");
  private usersCol = adminDb.collection("users");

  async getSettings() {
    try {
      const snapshot = await this.settingsCol.limit(1).get();
      if (snapshot.empty) return undefined;
      return snapshot.docs[0].data() as Settings;
    } catch (error) {
      console.error("Error fetching settings from Firestore:", error);
      return undefined;
    }
  }

  async updateSettings(data: any) {
    try {
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
    } catch (error) {
      console.error("Error updating settings in Firestore:", error);
      throw error;
    }
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
      lastResetDate: data.lastResetDate ? new Date(data.lastResetDate) : new Date()
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
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      lastRun: doc.data().lastRun ? new Date(doc.data().lastRun) : null
    } as Workflow));
  }

  async createWorkflow(data: any) {
    const id = Date.now();
    const docRef = await this.workflowsCol.add({ ...data, id, status: "idle" });
    const doc = await docRef.get();
    return doc.data() as Workflow;
  }

  async updateWorkflow(id: number, enabled?: boolean, updates?: any) {
    const snapshot = await this.workflowsCol.where("id", "==", id).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const finalUpdates = { ...updates };
      if (enabled !== undefined) finalUpdates.enabled = enabled;
      
      // Convert dates to ISO strings for Firestore if they exist in updates
      if (finalUpdates.lastRun instanceof Date) {
        finalUpdates.lastRun = finalUpdates.lastRun.toISOString();
      }

      await doc.ref.update(finalUpdates);
      const updatedData = { ...doc.data(), ...finalUpdates };
      return {
        ...updatedData,
        lastRun: updatedData.lastRun ? new Date(updatedData.lastRun) : null
      } as Workflow;
    }
    throw new Error("Workflow not found");
  }

  async getContent() {
    const snapshot = await this.contentCol.orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt)
    } as Content));
  }

  async getContentById(id: number) {
    const snapshot = await this.contentCol.where("id", "==", id).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as Content;
  }

  async createContent(data: any) {
    const id = Date.now();
    const createdAt = new Date().toISOString();
    const docRef = await this.contentCol.add({ ...data, id, createdAt });
    const doc = await docRef.get();
    const result = doc.data();
    if (!result) throw new Error("Failed to create content");
    return {
      ...result,
      createdAt: new Date(result.createdAt)
    } as Content;
  }

  async deleteContent(id: number) {
    const snapshot = await this.contentCol.where("id", "==", id).limit(1).get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
  }

  async getUserByFirebaseUid(uid: string) {
    const snapshot = await this.usersCol.where("firebaseUid", "==", uid).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as User;
  }

  async createUser(data: any) {
    const id = Date.now();
    const lastLogin = new Date().toISOString();
    const docRef = await this.usersCol.add({ ...data, id, lastLogin });
    const doc = await docRef.get();
    return doc.data() as User;
  }

  async updateUser(id: number, updates: any) {
    const snapshot = await this.usersCol.where("id", "==", id).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const finalUpdates = { ...updates };
      if (finalUpdates.lastLogin instanceof Date) {
        finalUpdates.lastLogin = finalUpdates.lastLogin.toISOString();
      }
      await doc.ref.update(finalUpdates);
      return { ...doc.data(), ...finalUpdates } as User;
    }
    throw new Error("User not found");
  }
}

export const storage = new FirebaseStorage();
