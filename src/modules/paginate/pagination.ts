import { PaginationResultInterface } from './pagination.results.interface';

export class Pagination<PaginationEntity> {
  public results: PaginationEntity[];
  public pagination: {
    total_page: number;
    page_size: number;
    current_page: number;
    total: number;
  };

  constructor(paginationResults: PaginationResultInterface<PaginationEntity>) {
    this.results = paginationResults.results;
    this.pagination = {
      total_page: paginationResults.total_page,
      page_size: paginationResults.page_size,
      current_page: paginationResults.current_page,
      total: paginationResults.total,
    };
  }
}
