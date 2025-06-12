"use client";

import styles from "./page.module.scss";
import { Button, HTMLSelect, InputGroup } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

export function Paging({
  length,
  paging,
  setPaging,
}: {
  length: number;
  paging: { take: number; skip: number };
  setPaging: (paging: { take: number; skip: number }) => void;
}) {

  const totalPages = Math.ceil(length / paging.take);
  const currentPage = Math.floor(paging.skip / paging.take) + 1;
  return (
    <>
      <HTMLSelect value={paging.take} onChange={(e) => setPaging({ take: parseInt(e.currentTarget.value), skip: 0 })}>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </HTMLSelect>
      <InputGroup
        className={styles.label}
        value={`page ${currentPage} of ${totalPages}`}
        readOnly
      />
      <Button
        icon={IconNames.STEP_BACKWARD}
        onClick={() => setPaging({ take: paging.take, skip: 0 })}
        disabled={paging.skip === 0}
      />
      <Button
        icon={IconNames.CARET_LEFT}
        onClick={() => setPaging({ take: paging.take, skip: Math.max(0, paging.skip - paging.take) })}
        disabled={paging.skip === 0}
      />
      <Button
        icon={IconNames.CARET_RIGHT}
        onClick={() =>
          setPaging({
            take: paging.take,
            skip: Math.min((totalPages - 1) * paging.take, paging.skip + paging.take),
          })
        }
        disabled={currentPage === totalPages}
      />
      <Button
        icon={IconNames.STEP_FORWARD}
        onClick={() => setPaging({ take: paging.take, skip: Math.trunc(length / paging.take) * paging.take })}
        disabled={currentPage === totalPages}
      />
    </>
  );
}
