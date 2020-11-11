import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from "@microsoft/sp-property-pane";
import {
  BaseClientSideWebPart,
  WebPartContext,
} from "@microsoft/sp-webpart-base";

import * as strings from "AppleMapsWebPartStrings";
import AppleMaps from "./components/AppleMaps";
import { IAppleMapsProps } from "./components/IAppleMapsProps";

export interface IAppleMapsWebPartProps {
  title: string;
  showPin: boolean;
  pinLabel: string;
  address: string;
  zoom: number;
  latitude: string;
  longitude: string;
  context: WebPartContext;
}

export default class AppleMapsWebPart extends BaseClientSideWebPart<
  IAppleMapsWebPartProps
> {
  public render(): void {
    const element: React.ReactElement<IAppleMapsProps> = React.createElement(
      AppleMaps,
      {
        displayMode: this.displayMode,
        context: this.context,

        title: this.properties.title,
        showPin: this.properties.showPin,
        pinLabel: this.properties.pinLabel,
        address: this.properties.address,
        zoom: this.properties.zoom,
        updateTitle: (value: string) => {
          this.properties.title = value;
        },
        updateAddress: (value: string) => {
          this.properties.address = value;
        },

        latitude: this.properties.latitude,
        longitude: this.properties.longitude,
        updateLatitude: (value: string) => {
          this.properties.latitude = value;
        },
        updatLongitude: (value: string) => {
          this.properties.longitude = value;
        },
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description:
              "Give the pin on the map a specific label or change the address that appears on your page. For example, you can add a specific floor or building name to the street address.",
          },
          groups: [
            {
              groupFields: [
                PropertyPaneToggle("showPin", {
                  label: "Show pin on map",
                  onText: "Yes",
                  offText: "No",
                }),
                PropertyPaneTextField("pinLabel", {
                  label: "Pin label",
                  disabled: !this.properties.showPin,
                }),
                PropertyPaneTextField("address", {
                  label: "Address to be shown",
                }),
                PropertyPaneSlider("zoom", {
                  label: "Zoom Level",
                  min: 0,
                  max: 22,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
