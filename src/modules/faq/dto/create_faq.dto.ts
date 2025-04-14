export enum Status {
  Show = 'show',
  Hide = 'hide',
  Main = 'main',
}

export class CreateFaqDto {
  question: string;
  answer: string;
  status?: Status;
}
