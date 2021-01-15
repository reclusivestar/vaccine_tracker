import { useState, useEffect, setState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Annotation
  } from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import { extent } from "d3-array";
import { geoCentroid } from "d3-geo";
import axios from 'axios';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const offsets = {
    VT: [50, -8],
    NH: [34, 2],
    MA: [30, -1],
    RI: [28, 2],
    CT: [35, 10],
    NJ: [34, 1],
    DE: [33, 0],
    MD: [47, 10],
    DC: [49, 21]
  };

const Map = (props) => {
  const url = "https://datausa.io/api/data?drilldowns=State&measures=Population";
  const [allStates, setAllStates] = useState([]);
  const [timeSeries, setTimeSeries] = useState([]);
  const [populations, setPopulations] = useState([]);
  const colors = ["#ffedea", "#ffcec5", "#ffad9f", "#ff8a75", 
  "#ff5533", "#e2492d", "#be3d26", "#9a311f", "#782618"];

  function extractNumbers() {
    let data = [];
    timeSeries.forEach(state => {
      if (state.data[0]){
        state.data.forEach(date => 
          data.push(getRate(state.val, date.count))
        );
      }
    });
    return data;
  }

  const colorScale = scaleQuantize()
  .domain(extent(extractNumbers())).nice()
  .range(colors);
  
  function extractDomain(){
    const domains = [];
    colors.forEach(color => 
      domains.push({"color" : color, "range" : colorScale.invertExtent(color)})
    );
    return domains;
  }

  async function getAllPopulations(){
    const response = await axios.get(url); 
    setPopulations(response.data.data);
  }

  useEffect(() => {
    let data = filterField(props.data, "people_total");
    setTimeSeries(data);
    setAllStates(filterDate(data, "12/18/2020"));
    getAllPopulations();
  }, [props.data]);


  function getRate(val, count){
    let pop = populations.filter(state => state["ID State"].slice(-2) === val)[0];
    if (pop) //some states not in population data
      return count / pop.Population * 100;
    return 0;
  }

  function filterLatest(){
    let latest = [];
    props.data.forEach(field => {
        let newData = [];
        field.data.forEach(row => {
            newData.push({...row, data: row.data.slice(row.data.length - 1)});
        });
        latest.push({...field, data: newData});
    });
    return latest;
  }

  function filterField(allData, title){
    let filtered = [];
    allData.forEach(field => {
    let onlyData = field.data.filter(row => row.title === title)[0].data;
    let parsed = [];
        if (onlyData){
            parsed = onlyData.map(val => {
                return {"date" : val[0], "count" : parseInt(val[2])};
            });
        }
        filtered.push({...field, data: parsed});
    });
    return filtered;
  }

  function filterDate(data, date) {
    let filtered = [];
    data.forEach(state => {
      let newData = state.data.filter(data => data.date === date);
      filtered.push({...state, data: newData});
    });
    return filtered;
  }

  const handleClick = val => () => {
    let state = allStates.filter(state => state.val === val);
    console.log(getRate(val, state[0].data[0].count));
    console.log(state);
  };

  console.log(allStates);
  console.log(extractNumbers());

  function legend(){
    let domains = extractDomain();
    console.log(domains);
    return (
      <div style={{marginLeft: "5%", marginTop: "10%"}}>
        {domains.map((domain, i) => {
          let low = Math.round((domain.range[0] + Number.EPSILON) * 100) / 100;
          let high = Math.round((domain.range[1] + Number.EPSILON) * 100) / 100;
          return (
            <div style={{display: "flex"}}>
              <div style={{ backgroundColor: colors[i], padding: "1vw" }} key={i}></div>
                <p style={{fontSize: "1vw", marginLeft: "1vw"}}>{low}% - {high}%</p>
              </div>
          )}
        )}
      </div>
    );
  }

  return (
    <div style={{display: "flex",  justifyContent: "center"}}>
      <div style={{width: "80%"}}>
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
        {({ geographies }) => (
          <>
            {geographies.map(geo => {
              //const cur = data.find(s => s.id === geo.id);
              const cur = allStates.find(s => s.val === geo.id);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={cur && cur.data[0] ? colorScale(getRate(cur.val, cur.data[0].count)) : "#A9A9A9"}
                  onClick={handleClick(geo.id)}
                  /*onMouseEnter={() => console.log(geo.id)}*/
                />
              );
            })}
            {geographies.map(geo => {
              const centroid = geoCentroid(geo);
              const cur = allStates.find(s => s.val === geo.id);
              return (
                <g key={geo.rsmKey + "-name"}>
                  {cur &&
                    centroid[0] > -160 &&
                    centroid[0] < -67 &&
                    (Object.keys(offsets).indexOf(cur.id) === -1 ? (
                      <Marker coordinates={centroid}>
                        <text y="2" fontSize={14} textAnchor="middle">
                          {cur.id}
                        </text>
                      </Marker>
                    ) : (
                      <Annotation
                        subject={centroid}
                        dx={offsets[cur.id][0]}
                        dy={offsets[cur.id][1]}
                      >
                        <text x={4} fontSize={14} alignmentBaseline="middle">
                          {cur.id}
                        </text>
                      </Annotation>
                    ))}
                </g>
              );
            })}
          </>
        )}
      </Geographies>
      </ComposableMap>
      </div>
      {legend()}
    </div>
  );
};

export default Map;
