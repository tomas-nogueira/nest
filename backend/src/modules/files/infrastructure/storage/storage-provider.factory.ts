import { env } from "../../../../config/env";
import type { StorageProvider } from "../../domain/storage-provider";
import { LocalStorageProvider } from "./local-storage.provider";

const makeStorageProvider = (): StorageProvider => {
	switch (env.FILE_STORAGE_PROVIDER) {
		case "local":
			return new LocalStorageProvider(env.LOCAL_STORAGE_PATH);
		default:
			throw new Error("Provider de armazenamento não configurado.");
	}
};

const storageProvider = makeStorageProvider();

export { storageProvider };
