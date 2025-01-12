export function osmIsInterestingTag(key) {
    return key !== 'attribution' &&
        key !== 'created_by' &&
        key !== 'source' &&
        key !== 'odbl' &&
        key.indexOf('tiger:') !== 0;
}

export var osmAreaKeys = {};
export function osmSetAreaKeys(value) {
    osmAreaKeys = value;
}

// Tags that indicate a node can be a standalone point
// e.g. { amenity: { bar: true, parking: true, ... } ... }
export var osmPointTags = {};
export function osmSetPointTags(value) {
    osmPointTags = value;
}
// Tags that indicate a node can be part of a way
// e.g. { amenity: { parking: true, ... }, highway: { stop: true ... } ... }
export var osmVertexTags = {};
export function osmSetVertexTags(value) {
    osmVertexTags = value;
}

export function osmNodeGeometriesForTags(nodeTags) {
    var geometries = {};
    for (var key in nodeTags) {
        if (osmPointTags[key] &&
            (osmPointTags[key]['*'] || osmPointTags[key][nodeTags[key]])) {
            geometries.point = true;
        }
        if (osmVertexTags[key] &&
            (osmVertexTags[key]['*'] || osmVertexTags[key][nodeTags[key]])) {
            geometries.vertex = true;
        }
        // break early if both are already supported
        if (geometries.point && geometries.vertex) break;
    }
    return geometries;
}

export var osmOneWayTags = {
    'aerialway': {
        'chair_lift': true,
        'drag_lift': true,
        'j-bar': true,
        'magic_carpet': true,
        'mixed_lift': true,
        'platter': true,
        'rope_tow': true,
        't-bar': true,
        'zip_line': true
    },
    'highway': {
        'motorway': true
    },
    'junction': {
        'circular': true,
        'roundabout': true
    },
    'man_made': {
        'piste:halfpipe': true
    },
    'piste:type': {
        'downhill': true,
        'sled': true,
        'yes': true
    },
    'waterway': {
        'canal': true,
        'ditch': true,
        'drain': true,
        'river': true,
        'stream': true
    }
};


export var osmPavedTags = {
    'surface': {
        'paved': true,
        'asphalt': true,
        'concrete': true,
        'concrete:lanes': true,
        'concrete:plates': true
    },
    'tracktype': {
        'grade1': true
    }
};

export var osmRightSideIsInsideTags = {
    'natural': {
        'cliff': true,
        'coastline': 'coastline',
    },
    'barrier': {
        'retaining_wall': true,
        'kerb': true,
        'guard_rail': true,
        'city_wall': true,
    },
    'man_made': {
        'embankment': true
    }
};

export var osmTagsAllowingBridges = {
    highway: {
        motorway: true, trunk: true, primary: true, secondary: true, tertiary: true, residential: true,
        motorway_link: true, trunk_link: true, primary_link: true, secondary_link: true, tertiary_link: true,
        unclassified: true, road: true, service: true, track: true, living_street: true, bus_guideway: true,
        path: true, footway: true, cycleway: true, bridleway: true, pedestrian: true, corridor: true, steps: true,
        raceway: true
    },
    railway: {
        rail: true, light_rail: true, tram: true, subway: true,
        monorail: true, funicular: true, miniature: true, narrow_gauge: true,
        disused: true, preserved: true, abandoned: true
    }
};
export var osmTagsAllowingTunnels = {
    highway: {
        motorway: true, trunk: true, primary: true, secondary: true, tertiary: true, residential: true,
        motorway_link: true, trunk_link: true, primary_link: true, secondary_link: true, tertiary_link: true,
        unclassified: true, road: true, service: true, track: true, living_street: true, bus_guideway: true,
        path: true, footway: true, cycleway: true, bridleway: true, pedestrian: true, corridor: true, steps: true,
        raceway: true
    },
    railway: {
        rail: true, light_rail: true, tram: true, subway: true,
        monorail: true, funicular: true, miniature: true, narrow_gauge: true,
        disused: true, preserved: true, abandoned: true
    },
    waterway: {
        canal: true, ditch: true, drain: true, river: true, stream: true
    }
};

// "highway" tag values for pedestrian or vehicle right-of-ways that make up the routable network
// (does not include `raceway`)
export var osmRoutableHighwayTagValues = {
    motorway: true, trunk: true, primary: true, secondary: true, tertiary: true, residential: true,
    motorway_link: true, trunk_link: true, primary_link: true, secondary_link: true, tertiary_link: true,
    unclassified: true, road: true, service: true, track: true, living_street: true, bus_guideway: true,
    path: true, footway: true, cycleway: true, bridleway: true, pedestrian: true, corridor: true, steps: true
};
// "highway" tag values that generally do not allow motor vehicles
export var osmPathHighwayTagValues = {
    path: true, footway: true, cycleway: true, bridleway: true, pedestrian: true, corridor: true, steps: true
};

// "railway" tag values representing existing railroad tracks (purposely does not include 'abandoned')
export var osmRailwayTrackTagValues = {
    rail: true, light_rail: true, tram: true, subway: true,
    monorail: true, funicular: true, miniature: true, narrow_gauge: true,
    disused: true, preserved: true
};

// "waterway" tag values for line features representing water flow
export var osmFlowingWaterwayTagValues = {
    canal: true, ditch: true, drain: true, river: true, stream: true
};
