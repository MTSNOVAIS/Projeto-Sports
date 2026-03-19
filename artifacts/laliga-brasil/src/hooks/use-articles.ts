import { 
  useListArticles, 
  useGetArticle, 
  useAdminListArticles, 
  useAdminGetArticle, 
  useCreateArticle, 
  useUpdateArticle, 
  useDeleteArticle, 
  usePublishArticle, 
  useScheduleArticle 
} from "@workspace/api-client-react";

// Re-exporting hooks to satisfy standard project structure and centralized imports
export {
  useListArticles,
  useGetArticle,
  useAdminListArticles,
  useAdminGetArticle,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  usePublishArticle,
  useScheduleArticle
};
