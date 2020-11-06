import * as React from "react";
import styles from "./AppleMaps.module.scss";
import { IAppleMapsProps } from "./IAppleMapsProps";
import { IAppleMapsState } from "./IAppleMapsState";
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { SearchBox } from "office-ui-fabric-react/lib/SearchBox";
import * as mapkit from "mapkit";
import { HttpClient, HttpClientResponse } from "@microsoft/sp-http";
import { DisplayMode } from "@microsoft/sp-core-library";
import { Label } from "office-ui-fabric-react";
import { IAppleMapsWebPartProps } from "../AppleMapsWebPart";

export default class AppleMaps extends React.Component<
  IAppleMapsProps,
  IAppleMapsState
> {
  constructor(props: IAppleMapsProps) {
    super(props);

    this.state = { map: null, annotation: null };
  }

  public render(): React.ReactElement<IAppleMapsProps> {
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
            placeholder="Address or Coordinates"
          ></SearchBox>
        ) : null}
        {this.props.displayMode == DisplayMode.Read && this.props.address ? (
          <Label>{this.props.address}</Label>
        ) : null}
        <div className={styles.map} id="map"></div>
      </div>
    );
  }

  private _search = (address: string) => {
    this.props.updateAddress(address);
    this._findCoordinate(address)
      .then((coordinate) => {
        this._showArea(coordinate);
      })
      .catch((error) => {
        alert(error);
      });
  };

  private _showArea(coordinate) {
    let zoom = this._getZoomLevel();
    let region = new mapkit.CoordinateRegion(
      coordinate,
      new mapkit.CoordinateSpan(zoom, zoom)
    );

    if (this.state.map) {
      this.state.map.region = region;
    }
  }

  private _getZoomLevel() {
    let zoom = 0;
    switch (this.props.zoom) {
      case 1:
        zoom = 0.01;
        break;
      case 2:
        zoom = 0.1;
        break;
      case 3:
        zoom = 1;
        break;
      case 4:
        zoom = 5;
        break;
      case 5:
        zoom = 10;
        break;
      case 6:
        zoom = 20;
        break;
      case 7:
        zoom = 50;
        break;
      case 8:
        zoom = 100;
        break;
    }

    return zoom;
  }

  private _showPin(coordinate) {
    let annotation = new mapkit.MarkerAnnotation(coordinate);
    annotation.title = this.props.pinLabel;
    this.setState({ annotation: annotation });
    this.state.map.showItems([annotation]);
  }

  private _removePin() {
    if (this.state.annotation) {
      this.state.map.removeAnnotation(this.state.annotation);
    }
  }

  private _findCoordinate(address) {
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
          let coordinate = new mapkit.Coordinate(latitude, longitude);
          resolve(coordinate);
        } else {
          reject(`Coordinates of ${address} not found`);
        }
      });
    });
  }

  public componentDidUpdate(prevProps: IAppleMapsWebPartProps) {
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
  }

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
