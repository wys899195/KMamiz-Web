import { TRequestTypeUpper } from "./TRequestType";

export type TEndpointDependency = {
  endpoint: TEndpointInfo;
  lastUsageTimestamp: number; //milliseconds
  dependingOn: {
    endpoint: TEndpointInfo;
    distance: number;
    type: "SERVER";
  }[];
  dependingBy: {
    endpoint: TEndpointInfo;
    distance: number;
    type: "CLIENT";
  }[];
};
export type TEndpointInfo = {
  uniqueServiceName: string;
  uniqueEndpointName: string;
  // trace name, label
  name: string;
  service: string;
  namespace: string;
  version: string;
  // "http.url", true request url
  url: string;
  // host, path, port are from "http.url"
  host: string;
  path: string;
  port: string;
  method: TRequestTypeUpper;
  clusterName: string;
  timestamp: number; 
};

export type TEndpointDependencyCombined = {
  endpoint: TEndpointInfo;
  distance: number;
  type: "SERVER" | "CLIENT";
};
