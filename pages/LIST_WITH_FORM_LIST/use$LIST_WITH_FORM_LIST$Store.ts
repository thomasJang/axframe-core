import create from "zustand";
import { ExampleItem, ExampleListRequest, ExampleSubItem } from "@core/services/example/ExampleRepositoryInterface";
import { AXFDGDataItem, AXFDGDataItemStatus, AXFDGPage, AXFDGSortParam } from "@axframe/datagrid";
import { ExampleService } from "services";
import { errorDialog } from "@core/components/dialogs/errorDialog";
import { setMetaDataByPath } from "@core/stores/usePageTabStore";
import { subscribeWithSelector } from "zustand/middleware";
import shallow from "zustand/shallow";
import { PageStoreActions, StoreActions } from "@core/stores/types";
import { pageStoreActions } from "@core/stores/pageStoreActions";
import React from "react";
import { ROUTES } from "router/Routes";
import { omit, pick } from "lodash";
import { convertDateToString } from "@core/utils/object";

interface ListRequest extends ExampleListRequest {}
interface SaveRequest extends ExampleItem {}
interface DtoItem extends ExampleItem {}
interface DtoSubItem extends ExampleSubItem {}

interface MetaData {
  listRequestValue: ListRequest;
  listColWidths: number[];
  listSortParams: AXFDGSortParam[];
  listSelectedRowKey?: React.Key;
  flexGrow: number;
  saveRequestValue: SaveRequest;
  detail?: SaveRequest;
  formActive: boolean;

  subListColWidths: number[];
  subListSelectedRowKey?: React.Key;
  subListCheckedIndexes?: number[];
  subListData: AXFDGDataItem<DtoSubItem>[];
}

interface States extends MetaData {
  routePath: string; // initialized Store;
  listSpinning: boolean;
  listData: AXFDGDataItem<DtoItem>[];
  listPage: AXFDGPage;
  saveSpinning: boolean;

  subListSpinning: boolean;
}

interface Actions extends PageStoreActions<States> {
  setListRequestValue: (requestValue: ListRequest) => void;
  setListColWidths: (colWidths: number[]) => void;
  setListSpinning: (spinning: boolean) => void;
  setListSortParams: (sortParams: AXFDGSortParam[]) => void;
  setListSelectedRowKey: (key?: React.Key, detail?: DtoItem) => void;
  callListApi: (request?: ListRequest) => Promise<void>;
  changeListPage: (currentPage: number, pageSize?: number) => Promise<void>;
  setFlexGrow: (flexGlow: number) => void;

  setSaveRequestValue: (exampleSaveRequestValue: SaveRequest) => void;
  setSaveSpinning: (exampleSaveSpinning: boolean) => void;
  callSaveApi: (request?: SaveRequest) => Promise<void>;
  cancelFormActive: () => void;
  setFormActive: () => void;

  setSubListColWidths: (colWidths: number[]) => void;
  setSubListSpinning: (spinning: boolean) => void;
  setSubListSelectedRowKey: (key?: React.Key) => void;
  setSubListCheckedIndexes: (indexes?: number[]) => void;
  addSubList: (list: DtoSubItem[]) => void;
  delSubList: (indexes: number[]) => void;
}

// create states
const createState: States = {
  routePath: ROUTES.EXAMPLES.children.LIST_WITH_FORM_LIST.path,
  listRequestValue: { pageNumber: 1, pageSize: 100 },
  listColWidths: [],
  listSpinning: false,
  listData: [],
  listPage: {
    currentPage: 0,
    totalPages: 0,
  },
  listSortParams: [],
  listSelectedRowKey: "",
  flexGrow: 1,
  saveRequestValue: {},
  detail: {},
  saveSpinning: false,
  formActive: false,

  subListColWidths: [],
  subListSpinning: false,
  subListData: [],
};

// create actions
const createActions: StoreActions<States & Actions, Actions> = (set, get) => ({
  setListRequestValue: (requestValues) => {
    set({ listRequestValue: requestValues });
  },
  setListColWidths: (colWidths) => set({ listColWidths: colWidths }),
  setListSpinning: (spinning) => set({ listSpinning: spinning }),
  setListSortParams: (sortParams) => set({ listSortParams: sortParams }),
  setListSelectedRowKey: async (key, detail) => {
    const saveRequestValue = { ...omit(detail, ["subList"]) };
    const subListData = detail?.subList?.map((values) => ({
      values,
    }));
    set({
      listSelectedRowKey: key,
      saveRequestValue,
      detail,
      subListData,
      subListCheckedIndexes: [],
      subListSelectedRowKey: undefined,
    });
  },
  callListApi: async (request) => {
    await set({ listSpinning: true });

    try {
      const apiParam = request ?? get().listRequestValue;
      const response = await ExampleService.list(apiParam);

      set({
        listData: response.ds.map((values) => ({
          values,
        })),
        listPage: {
          currentPage: response.rs.pageNumber ?? 1,
          pageSize: response.rs.pageSize ?? 0,
          totalPages: response.rs.pgCount ?? 0,
          totalElements: response.ds.length,
        },
      });
    } catch (e) {
      await errorDialog(e as any);
    } finally {
      await set({ listSpinning: false });
    }
  },
  changeListPage: async (pageNumber, pageSize) => {
    const requestValues = {
      ...get().listRequestValue,
      pageNumber,
      pageSize,
    };
    set({ listRequestValue: requestValues });
    await get().callListApi();
  },
  setFlexGrow: (flexGlow) => {
    set({ flexGrow: flexGlow });
  },
  setSaveRequestValue: (exampleSaveRequestValue) => {
    set({ saveRequestValue: exampleSaveRequestValue });
  },
  setSaveSpinning: (exampleSaveSpinning) => set({ saveSpinning: exampleSaveSpinning }),
  callSaveApi: async (request) => {
    await set({ saveSpinning: true });

    try {
      // subList 데이터를 어떻게 전송할지 체크 필요!!
      const apiParam = request ?? {
        ...get().saveRequestValue,
        subList: get().subListData.map((item) => {
          const ITEM_STAT = {
            [AXFDGDataItemStatus.new]: "C",
            [AXFDGDataItemStatus.edit]: "U",
            [AXFDGDataItemStatus.remove]: "D",
          };
          return { ...item.values, status: ITEM_STAT[item.status ?? AXFDGDataItemStatus.edit] };
        }),
      };

      await ExampleService.save(convertDateToString(apiParam));
    } catch (e) {
      await errorDialog(e as any);
    } finally {
      await set({ saveSpinning: false });
    }
  },
  cancelFormActive: () => {
    set({
      formActive: false,
      listSelectedRowKey: undefined,
      subListCheckedIndexes: [],
      subListSelectedRowKey: undefined,
    });
  },
  setFormActive: () => {
    set({
      formActive: true,
      detail: undefined,
      saveRequestValue: {},
      subListData: [],
      subListCheckedIndexes: [],
      subListSelectedRowKey: undefined,
    });
  },

  setSubListColWidths: (colWidths) => set({ subListColWidths: colWidths }),
  setSubListSpinning: (spinning) => set({ subListSpinning: spinning }),
  setSubListSelectedRowKey: async (key) => {
    set({ subListSelectedRowKey: key });
  },
  setSubListCheckedIndexes: (indexes) => {
    set({ subListCheckedIndexes: indexes });
  },
  addSubList: (list) => {
    const subList = get().subListData ?? [];

    if (!subList) return;
    const _list = list.map((n) => ({
      status: AXFDGDataItemStatus.new,
      values: n,
    }));

    subList.push(..._list);

    set({ subListData: [...subList] });
  },
  delSubList: (indexes) => {
    const subList = get().subListData;

    if (!subList) return;
    const subListData = subList
      .map((item, index) => {
        if (indexes.includes(index)) {
          if (item.status === AXFDGDataItemStatus.new) {
            return false;
          }
          return {
            ...item,
            status: AXFDGDataItemStatus.remove,
          };
        }

        return item;
      })
      .filter(Boolean) as AXFDGDataItem<ExampleSubItem>[];

    set({ subListData, subListCheckedIndexes: [] });
  },

  syncMetadata: (metaData) => {
    const metaDataKeys: (keyof MetaData)[] = [
      "listSortParams",
      "listRequestValue",
      "listColWidths",
      "listSelectedRowKey",
      "flexGrow",
      "saveRequestValue",
      "detail",
      "formActive",
      "subListCheckedIndexes",
      "subListSelectedRowKey",
      "subListColWidths",
      "subListData",
    ];
    set(pick(metaData ?? createState, metaDataKeys));
  },
  ...pageStoreActions(set, get),
});

// ---------------- exports
export interface $LIST_WITH_FORM_LIST$Store extends States, Actions, PageStoreActions<States> {}
export const use$LIST_WITH_FORM_LIST$Store = create(
  subscribeWithSelector<$LIST_WITH_FORM_LIST$Store>((set, get) => ({
    ...createState,
    ...createActions(set, get),
  }))
);

// pageModel 에 저장할 대상 모델 셀렉터 정의
use$LIST_WITH_FORM_LIST$Store.subscribe(
  (s) => [
    s.listSortParams,
    s.listRequestValue,
    s.listColWidths,
    s.listSelectedRowKey,
    s.flexGrow,
    s.saveRequestValue,
    s.detail,
    s.formActive,
    s.subListCheckedIndexes,
    s.subListSelectedRowKey,
    s.subListColWidths,
    s.subListData,
  ],
  ([
    listSortParams,
    listRequestValue,
    listColWidths,
    listSelectedRowKey,
    flexGrow,
    saveRequestValue,
    detail,
    formActive,
    subListCheckedIndexes,
    subListSelectedRowKey,
    subListColWidths,
    subListData,
  ]) => {
    setMetaDataByPath<MetaData>(createState.routePath, {
      listSortParams,
      listRequestValue,
      listColWidths,
      listSelectedRowKey,
      flexGrow,
      saveRequestValue,
      detail,
      formActive,
      subListCheckedIndexes,
      subListSelectedRowKey,
      subListColWidths,
      subListData,
    });
  },
  { equalityFn: shallow }
);