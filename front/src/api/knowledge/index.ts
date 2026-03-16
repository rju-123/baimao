import { get } from '@/utils/request';

export interface KnowledgeArticleListItem {
  id: number;
  title: string;
  summary: string;
  createtime?: number | null;
  updatetime?: number | null;
}

export interface KnowledgeArticleDetail {
  id: number;
  title: string;
  summary: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentPosition?: 'head' | 'tail';
  createtime?: number | null;
  updatetime?: number | null;
}

export interface ListKnowledgeParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const listKnowledgeArticles = (params: ListKnowledgeParams) =>
  get<{ list: KnowledgeArticleListItem[]; total: number; page: number; pageSize: number }>('/knowledge', {
    params,
  });

export const getKnowledgeArticle = (id: number) =>
  get<KnowledgeArticleDetail>(`/knowledge/${id}`);

