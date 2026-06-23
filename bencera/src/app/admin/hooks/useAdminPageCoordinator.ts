import { useAdminAuth } from "./useAdminAuth";
import { useAdminCatalog } from "./useAdminCatalog";
import { useCreateItemForm } from "./useCreateItemForm";
import { useEditItemForm } from "./useEditItemForm";

export function useAdminPageCoordinator() {
  const { catalogItems, fetchItems, handleDeleteItem } = useAdminCatalog();
  const createForm = useCreateItemForm({ refreshItems: fetchItems });
  const auth = useAdminAuth({
    onAuthenticated: fetchItems,
    onLoginAttempt: createForm.hideSuccess,
  });
  const editForm = useEditItemForm({ refreshItems: fetchItems });

  return {
    auth,
    catalogItems,
    createForm,
    editForm,
    fetchItems,
    handleDeleteItem,
  };
}
