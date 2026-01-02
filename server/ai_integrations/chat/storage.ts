import { adminDb } from "../../firebase-config.js";
import { type Conversation, type Message } from "../../../shared/schema.js";

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

export class ChatFirebaseStorage implements IChatStorage {
  private conversationsCol = adminDb.collection("conversations");
  private messagesCol = adminDb.collection("messages");

  async getConversation(id: number) {
    const snapshot = await this.conversationsCol.where("id", "==", id).limit(1).get();
    if (snapshot.empty) return undefined;
    const data = snapshot.docs[0].data();
    return { 
      id: data.id,
      platformId: data.platformId || "",
      content: data.content || "",
      response: data.response || null,
      status: data.status || "pending",
      createdAt: new Date(data.createdAt) 
    } as Conversation;
  }

  async getAllConversations() {
    const snapshot = await this.conversationsCol.orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: data.id,
        platformId: data.platformId || "",
        content: data.content || "",
        response: data.response || null,
        status: data.status || "pending",
        createdAt: new Date(data.createdAt) 
      } as Conversation;
    });
  }

  async createConversation(title: string) {
    const id = Date.now();
    const createdAt = new Date().toISOString();
    const conversationData = { 
      id, 
      platformId: title, // Using title as platformId for now
      content: title,
      response: null,
      status: "pending", 
      createdAt 
    };
    await this.conversationsCol.add(conversationData);
    return { ...conversationData, createdAt: new Date(createdAt) } as Conversation;
  }

  async deleteConversation(id: number) {
    const messagesSnapshot = await this.messagesCol.where("conversationId", "==", id).get();
    const batch = adminDb.batch();
    messagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    const conversationSnapshot = await this.conversationsCol.where("id", "==", id).limit(1).get();
    if (!conversationSnapshot.empty) {
      batch.delete(conversationSnapshot.docs[0].ref);
    }
    await batch.commit();
  }

  async getMessagesByConversation(conversationId: number) {
    const snapshot = await this.messagesCol.where("conversationId", "==", conversationId).orderBy("createdAt").get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: data.id,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        createdAt: new Date(data.createdAt) 
      } as Message;
    });
  }

  async createMessage(conversationId: number, role: string, content: string) {
    const id = Date.now();
    const createdAt = new Date().toISOString();
    const messageData = { id, conversationId, role, content, createdAt };
    await this.messagesCol.add(messageData);
    return { ...messageData, createdAt: new Date(createdAt) } as Message;
  }
}

export const chatStorage = new ChatFirebaseStorage();

