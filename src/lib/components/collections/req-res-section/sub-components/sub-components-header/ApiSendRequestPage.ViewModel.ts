import {
  RequestDataset,
  RequestMethod,
  RequestDataType,
} from "$lib/utils/enums/request.enum";
import {
  findAuthHeader,
  findAuthParameter,
} from "$lib/utils/helpers/auth.helper";
import type {
  Body,
  KeyValuePair,
  NewTab,
} from "$lib/utils/interfaces/request.interface";
import type {
  RequestDatasetType,
  RequestRawType,
} from "$lib/utils/types/request.type";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { addRxPlugin } from "rxdb";
import { TabRepository } from "$lib/repositories/tab.repository";
addRxPlugin(RxDBUpdatePlugin);
/* eslint-disable @typescript-eslint/no-explicit-any */

enum fileType {
  FILE = "File",
  TEXT = "Text",
}

type Type = "File" | "Text";

class ApiSendRequestViewModel {
  private tabRepository = new TabRepository();
  constructor() {}

  get tab() {
    return this.tabRepository.getTab();
  }

  public updateRequestProperty = async (data: any, route: string) => {
    await this.tabRepository.setRequestProperty(data, route);
  };

  // public updateRequestResponse = async (data: any) => {
  //   await rxdb.tab.setRequestResponse(data);
  //   return
  // }

  private ensureHttpOrHttps = (str) => {
    if (str.startsWith("http://") || str.startsWith("https://")) {
      return "";
    } else if (str.startsWith("//")) {
      return "http:";
    } else {
      return "http://";
    }
  };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private extractKeyValue = (pairs: any[], type: Type): string => {
    let response: string = "";
    let storage: string = "";
    let count: number = 0;
    for (const pair of pairs) {
      if (pair.checked) {
        count++;
        if (type === fileType.TEXT) {
          storage += `${pair.key}=${pair.value}&`;
        } else if (type === fileType.FILE) {
          storage += `${pair.key}=${pair.base}&`;
        }
      }
    }
    if (count !== 0) {
      response = storage.slice(0, -1);
    }
    return response;
  };

  private extractURl = (url: string, request: NewTab): string => {
    const authHeader: {
      key: string;
      value: string;
    } = findAuthParameter(request);
    if (authHeader.key && authHeader.value) {
      let flag: boolean = false;
      for (let i = 0; i < url.length; i++) {
        if (url[i] === "?") {
          flag = true;
        }
      }
      if (!flag) {
        return (
          this.ensureHttpOrHttps(url) +
          url +
          "?" +
          authHeader.key +
          "=" +
          authHeader.value
        );
      }
      return (
        this.ensureHttpOrHttps(url) +
        url +
        "&" +
        authHeader.key +
        "=" +
        authHeader.value
      );
    }
    return this.ensureHttpOrHttps(url) + url;
  };

  private extractHeaders = (
    headers: KeyValuePair[],
    autoGeneratedHeaders: KeyValuePair[],
    request: NewTab,
  ): string => {
    const authHeader: {
      key: string;
      value: string;
    } = findAuthHeader(request);
    if (authHeader.key && authHeader.value) {
      return (
        authHeader.key +
        "=" +
        authHeader.value +
        "&" +
        this.extractKeyValue(
          [...headers, ...autoGeneratedHeaders],
          fileType.TEXT,
        )
      );
    }
    return this.extractKeyValue(
      [...headers, ...autoGeneratedHeaders],
      fileType.TEXT,
    );
  };

  private extractBody = (
    datatype: RequestDatasetType,
    rawData: RequestRawType,
    body: Body,
  ): string => {
    const { raw, urlencoded, formdata } = body;
    if (datatype === RequestDataset.RAW) {
      if (rawData === RequestDataType.JSON && raw === "") {
        return "{}";
      }
      return raw;
    } else if (datatype === RequestDataset.FORMDATA) {
      return (
        this.extractKeyValue(formdata.text, fileType.TEXT) +
        "&" +
        this.extractKeyValue(formdata.file, fileType.FILE)
      );
    } else if (datatype === RequestDataset.URLENCODED) {
      return this.extractKeyValue(urlencoded, fileType.TEXT);
    } else if (datatype === RequestDataset.NONE) {
      return "";
    }
  };

  private extractMethod = (method: string): string => {
    if (method === RequestMethod.DELETE) {
      return "DELETE";
    } else if (method === RequestMethod.GET) {
      return "GET";
    } else if (method === RequestMethod.HEAD) {
      return "HEAD";
    } else if (method === RequestMethod.OPTIONS) {
      return "OPTIONS";
    } else if (method === RequestMethod.PATCH) {
      return "PATCH";
    } else if (method === RequestMethod.POST) {
      return "POST";
    } else if (method === RequestMethod.PUT) {
      return "PUT";
    }
  };

  private extractDataType = (
    datatype: RequestDatasetType,
    raw: RequestRawType,
  ): string => {
    if (datatype === RequestDataset.RAW) {
      if (raw === RequestDataType.JSON) {
        return "JSON";
      } else {
        return "TEXT";
      }
    } else if (datatype === RequestDataset.FORMDATA) {
      return "FORMDATA";
    } else if (datatype === RequestDataset.URLENCODED) {
      return "URLENCODED";
    } else if (datatype === RequestDataset.NONE) {
      return "TEXT";
    }
  };

  public decodeRestApiData(request: any): string[] {
    return [
      this.extractURl(request.url, request),
      this.extractMethod(request.method),
      this.extractHeaders(
        request.headers,
        request.autoGeneratedHeaders,
        request,
      ),
      this.extractBody(request.state.dataset, request.state.raw, request.body),
      this.extractDataType(request.state.dataset, request.state.raw),
    ];
  }
}

export { ApiSendRequestViewModel };
