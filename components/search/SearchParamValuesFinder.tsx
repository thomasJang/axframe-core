import * as React from "react";
import { SearchParamComponent } from "./SearchParam";
import { Form, Input, Button, Select } from "antd";
import styled from "@emotion/styled";
import { AXFISearch } from "@axframe/icon";

export const SearchParamValuesFinder: SearchParamComponent = ({
  name,
  label,
  value,
  options,
  width,
  placeholder,
  onSearch,
  onChangedComponentValue,
}) => {
  const form = Form.useFormInstance();

  const handleSearch = React.useCallback(async () => {
    const options = await onSearch?.();

    form.setFieldValue(name, options);
    onChangedComponentValue?.();
  }, [onSearch, form, name, onChangedComponentValue]);

  return (
    <Form.Item {...(label ? { label, style: { marginBottom: 0, marginRight: 10 } } : { noStyle: true })}>
      <Input.Group compact>
        <Form.Item name={name} noStyle>
          <Select
            mode={"multiple"}
            style={{ minWidth: 100, width }}
            placeholder={placeholder}
            options={value}
            labelInValue
            showArrow={false}
            // open={false}
            maxTagCount='responsive'
            allowClear
          />
        </Form.Item>
        <Button onClick={handleSearch} icon={<AXFISearch style={{ marginTop: 3 }} />} />
      </Input.Group>
    </Form.Item>
  );
};

const Container = styled.div`
  .ant-input-group-addon {
    padding: 0 5px;

    button {
      padding: 0 2px;
      &:hover {
        color: ${(p) => p.theme.primary_color};
      }
    }
  }
`;
