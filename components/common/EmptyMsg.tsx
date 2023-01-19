import * as React from "react";
import styled from "@emotion/styled";
import { AXFIDirections } from "@axframe/icon";
import { useI18n } from "../../hooks";
import { SMixinFlexColumn } from "../../styles/emotion";

interface Props {
  disableImg?: boolean;
  title?: string;
  msg?: string;
  children?: React.ReactNode;
}

function EmptyMsg({ disableImg, title, msg, children }: Props) {
  const { t } = useI18n();

  return (
    <Container>
      <div>
        {disableImg ? null : (
          <Img>
            <AXFIDirections />
          </Img>
        )}
        <Title>{title ?? t.msg.NotSelectedDetail.title}</Title>
        <Msg>{msg ?? t.msg.NotSelectedDetail.msg}</Msg>
      </div>
      {children && <div>{children}</div>}
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
  ${SMixinFlexColumn("center", "center")};

  gap: 20px;

  > div {
    ${SMixinFlexColumn("center", "center")};
  }
`;
const Img = styled.div`
  font-size: 100px;
  line-height: 1;
`;
const Title = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: ${(p) => p.theme.text_heading_color};
`;
const Msg = styled.div``;

export { EmptyMsg };
