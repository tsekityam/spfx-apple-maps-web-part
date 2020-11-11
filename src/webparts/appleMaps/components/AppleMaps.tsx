import * as React from "react";
import styles from "./AppleMaps.module.scss";
import { IAppleMapsProps } from "./IAppleMapsProps";
import { IAppleMapsState } from "./IAppleMapsState";
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { SearchBox } from "office-ui-fabric-react/lib/SearchBox";
import * as mapkit from "mapkit";
import { HttpClient, HttpClientResponse } from "@microsoft/sp-http";
import { DisplayMode } from "@microsoft/sp-core-library";
import {
  Dialog,
  DialogFooter,
  DialogType,
} from "office-ui-fabric-react/lib/Dialog";
import { Label } from "office-ui-fabric-react/lib/Label";
import { DefaultButton } from "office-ui-fabric-react/lib/Button";
import { IAppleMapsWebPartProps } from "../AppleMapsWebPart";
import { stringIsNullOrEmpty } from "@pnp/common";
import {
  Spinner,
  SpinnerSize,
} from "office-ui-fabric-react/lib/components/Spinner";

export default class AppleMaps extends React.Component<
  IAppleMapsProps,
  IAppleMapsState
> {
  private _annotations: any[];

  constructor(props: IAppleMapsProps) {
    super(props);

    this.state = {
      map: null,
      searching: false,
      error: "",
    };

    this._annotations = [];
  }

  public render(): React.ReactElement<IAppleMapsProps> {
    const dialogContentProps = {
      type: DialogType.normal,
      title: this.state.error,
      closeButtonAriaLabel: "Close",
    };

    return (
      <div className={styles.appleMaps}>
        <WebPartTitle
          displayMode={this.props.displayMode}
          title={this.props.title}
          updateProperty={this.props.updateTitle}
        />
        {this.props.displayMode == DisplayMode.Edit ? (
          <SearchBox
            className={styles.searchBox}
            onSearch={this._search}
            placeholder="Search for a place or address"
          ></SearchBox>
        ) : null}
        {this.state.searching ? <Spinner size={SpinnerSize.large} /> : null}
        <Dialog
          hidden={stringIsNullOrEmpty(this.state.error)}
          onDismiss={this._hideDialog}
          dialogContentProps={dialogContentProps}
        >
          <DialogFooter>
            <DefaultButton onClick={this._hideDialog} text="Close" />
          </DialogFooter>
        </Dialog>
        {this.props.displayMode == DisplayMode.Read &&
        !stringIsNullOrEmpty(this.props.address) ? (
          <Label>{this.props.address}</Label>
        ) : null}
        <div className={styles.mapContainer}>
          <div className={styles.dummy}></div>
          <div className={styles.map} id="map"></div>
        </div>
      </div>
    );
  }

  private _search = (address: string) => {
    this.setState({ searching: true });

    this.props.updateAddress(address);
    this._findCoordinate(address)
      .then((coordinate) => {
        this.setState({ searching: false });
        this._showArea(coordinate);
      })
      .catch((error) => {
        this.setState({ error: error, searching: false });
      });
  };

  private _hideDialog = () => {
    this.setState({ error: "" });
  };

  private _showArea = (coordinate) => {
    let zoom = 90 / Math.pow(2, this.props.zoom);
    let region = new mapkit.CoordinateRegion(
      coordinate,
      new mapkit.CoordinateSpan(zoom, zoom)
    );

    if (this.state.map) {
      this.state.map.region = region;
    }
  };

  private _showPin = (coordinate) => {
    let annotation = new mapkit.MarkerAnnotation(coordinate);
    annotation.title = this.props.pinLabel;

    this._removePin();

    this._annotations.push(annotation);
    this.state.map.showItems(this._annotations);
  };

  private _removePin = () => {
    this._annotations.map((value) => {
      this.state.map.removeAnnotation(value);
    });
    this._annotations = [];
  };

  private _findCoordinate = (address) => {
    let geocoder = new mapkit.Geocoder({
      language: "en-GB",
    });

    return new Promise((resolve, reject) => {
      geocoder.lookup(address, (error, data) => {
        if (error) {
          reject(error);
        }

        if (data.results.length > 0) {
          let result = data.results[0];
          let latitude = result.coordinate.latitude;
          let longitude = result.coordinate.longitude;

          this.props.updateLatitude(latitude);
          this.props.updatLongitude(longitude);
          this.props.updateAddress(result.formattedAddress);

          let coordinate = new mapkit.Coordinate(latitude, longitude);
          resolve(coordinate);
        } else {
          reject(`Address not found`);
        }
      });
    });
  };

  public componentDidUpdate = (prevProps: IAppleMapsWebPartProps) => {
    // If we have a snapshot value, we've just added new items.
    // Adjust scroll so these new items don't push the old ones out of view.
    // (snapshot here is the value returned from getSnapshotBeforeUpdate)
    if (
      prevProps.showPin != this.props.showPin ||
      prevProps.pinLabel != this.props.pinLabel
    ) {
      let coordinate = new mapkit.Coordinate(
        parseFloat(this.props.latitude),
        parseFloat(this.props.longitude)
      );
      if (this.props.showPin) {
        this._showPin(coordinate);
      } else {
        this._removePin();
      }
      this._showArea(coordinate);
    } else if (prevProps.zoom != this.props.zoom) {
      let coordinate = new mapkit.Coordinate(
        parseFloat(this.props.latitude),
        parseFloat(this.props.longitude)
      );
      this._showArea(coordinate);
    }
  };

  public componentDidMount = () => {
    mapkit.init({
      authorizationCallback: (done) => {
        var httpClient = this.props.context.httpClient;
        httpClient
          .get(
            "http://127.0.0.1:8787/services/jwt",
            HttpClient.configurations.v1
          )
          .then((response: HttpClientResponse) => {
            return response.text();
          })
          .then((responseText) => {
            done(responseText);
          })
          .catch((error) => console.error(error));
      },
    });

    mapkit.addEventListener("configuration-change", (event) => {
      switch (event.status) {
        case "Initialized":
          let coordinate = new mapkit.Coordinate(
            parseFloat(this.props.latitude),
            parseFloat(this.props.longitude)
          );
          if (this.props.showPin) {
            this._showPin(coordinate);
          } else {
            this._removePin();
          }
          this._showArea(coordinate);
          break;
      }
    });

    this.setState({ map: new mapkit.Map("map") });
  };
}
