export type IMarkdown = string;

export interface IProps {
  markdown?: IMarkdown;
  raw?: boolean;
}

function Markdown(props: IProps): ReactNode;

export default Markdown;
