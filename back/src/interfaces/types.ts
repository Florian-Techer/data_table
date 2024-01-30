export interface ColumnSearch {
  value: string;
  regex: boolean;
}

export interface ColumnSearchObject {
  data: string;
  name: string;
  searchable: boolean;
  orderable: boolean;
  search: ColumnSearch;
}
