import { DisplayMode } from "@microsoft/sp-core-library";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IAppleMapsProps {
  displayMode: DisplayMode;
  context: WebPartContext;

  title: string;
  showPin: boolean;
  pinLabel: string;
  address: string;
  zoom: number;
  updateTitle: (value: string) => void;
  updateAddress: (value: string) => void;

  latitude: string;
  longitude: string;
  updateLatitude: (value: string) => void;
  updatLongitude: (value: string) => void;
}
