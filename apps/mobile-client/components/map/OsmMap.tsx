/**
 * OsmMap — React Native Maps with free OpenStreetMap tiles.
 * Drop-in base map component: no API key needed.
 * Wraps MapView with UrlTile pointed at the OSM tile server.
 */
import React from 'react';
import MapView, { UrlTile, type MapViewProps, PROVIDER_DEFAULT } from 'react-native-maps';
import { StyleSheet, View, type ViewStyle } from 'react-native';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

interface OsmMapProps extends Omit<MapViewProps, 'provider'> {
    style?: ViewStyle;
    children?: React.ReactNode;
}

export function OsmMap({ style, children, ...rest }: OsmMapProps) {
    return (
        <View style={[styles.container, style]}>
            <MapView
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_DEFAULT}
                mapType="none"
                {...rest}
            >
                <UrlTile
                    urlTemplate={OSM_TILE_URL}
                    maximumZ={19}
                    flipY={false}
                    tileSize={256}
                />
                {children}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderRadius: 12,
    },
});
