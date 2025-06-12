export type IMarkdown = string;

export interface IProps {
  url: string;
  raw?: boolean;
}

function Markdown(props: IProps): ReactNode;

export default Markdown;
