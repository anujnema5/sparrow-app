import type { TabDocument } from "$lib/database/app.database";
import type { NewTab } from "./request.interface";

export interface CollectionsMethods {
  extractTabDocument: (doc: TabDocument) => NewTab;
  handleActiveTab: (id: string) => void;
  handleRemoveTab: (id: string) => void;
  handleCreateTab: (data) => void;
  updateTab: (data, route: string) => void;
  updateRequestProperty: (data, route: string) => void;
  updateRequestState: (data, route: string) => void;
}
