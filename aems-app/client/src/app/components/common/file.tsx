import { File as _File, ReadFilesQuery } from "@/graphql-codegen/graphql";
import { Button, Dialog, Icon } from "@blueprintjs/core";
import styles from "./page.module.scss";
import { useState } from "react";
import Image from "next/image";

export function FilePreview({ file }: { file: NonNullable<ReadFilesQuery["readFiles"]>[0] }) {
  const isImageFile = file.mimeType?.startsWith("image/");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const ImageComponent = (
    <Image
      src={`/api/file/${file.id}/download/${file.objectKey}`}
      className={`${styles.image} ${isExpanded ? styles.expand : ""}`}
      alt="Preview"
    />
  );

  return (
    <>
      <Dialog isOpen={isExpanded} onClose={() => setIsExpanded(false)}>
        <Button icon="cross" className={styles.exitButton} onClick={() => setIsExpanded(false)} />
        {ImageComponent}
      </Dialog>
      <div className={styles.file}>
        <div className={styles.fileActions}>
          <a href={`/api/file/${file.id}/download/${file.objectKey}`} download={file.objectKey}>
            <Button icon="download" small minimal />
          </a>
          {isImageFile && <Button icon="maximize" small minimal onClick={() => setIsExpanded(true)} />}
        </div>
        {isImageFile ? (
          ImageComponent
        ) : (
          <div className={styles.unknown}>
            <Icon icon="document" />
            <span>{file.objectKey?.split(".").pop()}</span>
          </div>
        )}
      </div>
    </>
  );
}

export function FilePreviews({ files }: { files: ReadFilesQuery["readFiles"] }) {
  if (files === null || files === undefined) {
    return;
  }

  return (
    <div className={styles.filePreviews}>
      <div className={styles.scroll}>
        {files.map((file, index) => (
          <div key={index}>
            <FilePreview file={file} />
          </div>
        ))}
      </div>
    </div>
  );
}
