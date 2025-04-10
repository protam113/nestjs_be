export interface PaginationInterface {
  total_page: number;
  page_size: number | 15;
  current_page: number;
  total: number;
  previous: string | null;
  next: string | null;
}

export interface PaginationResultInterface<PaginationEntity> {
  results: PaginationEntity[];
  total: number;
  total_page: number;
  page_size: number;
  current_page: number;
}
