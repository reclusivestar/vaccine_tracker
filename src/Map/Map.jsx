import { useState, useEffect } from "react";
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
import Time from './Time';
import { startOfToday, format } from "date-fns";
import state_names from './states_hash.json';
import { useMediaQuery } from 'react-responsive';

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
  const us_population_url = "https://datausa.io/api/data?drilldowns=Nation&measures=Population";
  const [allStates, setAllStates] = useState([]);
  const [timeSeries, setTimeSeries] = useState([]);
  const [populations, setPopulations] = useState([]);
  const [USPopulation, setUSPopulation] = useState([]);
  const [selectedTime, setSelectedTime] = useState();
  const [cumalativeSum, setCumalativeSum] = useState(0);
  const [highlightBox, setHighlightBox] = useState("");

  const isMobile = useMediaQuery({ query: `(max-width: 760px)` });

  const colors = ["#f0f9e8", "#97d5c0", "#4ba8c9", "#1d79b5", "#254b8c"]; 
  /* ["#ffedea", "#ffcec5", "#ffad9f", "#ff8a75", 
  "#ff5533", "#e2492d", "#be3d26", "#9a311f", "#782618"];*/

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
  async function getUSPopulation(){
    const response = await axios.get(us_population_url); 
    setUSPopulation(parseInt(response.data.data[0].Population));
  }

  //set defaults when map first loads
  useEffect(() => {
    const today = format(startOfToday(), "MM/dd/yyyy");
    console.log(props.data)
    let data = filterField(props.data, props.title);
    data = makeContinuous(data);
    setTimeSeries(data);
    setAllStates(filterDate(data, today));
    getAllPopulations();
    getUSPopulation();
    setSelectedTime(today);
  }, [props.data]);

  //changes based on the data selected
  useEffect(() => {
    let data = filterField(props.data, props.title);
    data = makeContinuous(data);
    setTimeSeries(data);
    setAllStates(filterDate(data, selectedTime));
    getAllPopulations();
  }, [props.title])

  //changes based on time selected
  useEffect(() => {
    setAllStates(filterDate(timeSeries, selectedTime));
  }, [selectedTime]);

  function getRate(val, count){
    let pop = populations.filter(state => state["ID State"].slice(-2) === val)[0];
    if (pop) //some states not in population data
      return count / parseInt(pop.Population) * 100;
    return 0;
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

  //update with days until today copying the last provided data
  function expandUntilToday(allData){
    allData.forEach(state => {
      if (state.data.length) {
        let latest = new Date(state.data[state.data.length - 1].date);
        let latestCount = state.data[state.data.length - 1].count
        let days = parseInt((startOfToday() - latest) / (1000 * 60 * 60 * 24), 10);
        while (days > 0) {
          latest.setDate(latest.getDate() + 1);
          state.data.push({
            date : format(latest, "MM/dd/yyyy"),
            count: latestCount
          });
          days--;
        }
      }
    })
    return allData;
  }

  // fill gaps between first and second date with data from the first
  function makeContinuous(allData){
    let continuous = [];
    allData.forEach(state => {
      let newIndex = 0;
      let newState = {...state};
      newState.data = Array.from(state.data);
      for (let i = 0; i + 1 < state.data.length; i++){
        let start = new Date(state.data[i].date);
        let end = new Date(state.data[i+1].date);
        let days = parseInt((end - start) / (1000 * 60 * 60 * 24), 10);
        while (days > 1){
          newIndex++;
          start.setDate(start.getDate() + 1);
          newState.data.splice(newIndex, 0, {
            date: format(start, "MM/dd/yyyy"),
            count: state.data[i].count
          });
          days--;
        }
        newIndex++;
      }
      continuous.push(newState);
    });
    return expandUntilToday(continuous);
  }

  function filterDate(data, date) {
    let filtered = [];
    data.forEach(state => {
      let newData = state.data.filter(data => data.date === date);
      filtered.push({...state, data: newData});
    });
    console.log(filtered, date);
    getSum(filtered);
    return filtered;
  }

  function getSum(data){
    let sum = 0;
    data.forEach(state => {
      if(state.data.length)
        sum += state.data[0].count;
    })
    setCumalativeSum(sum);
  }

  const handleClick = val => () => {
    let state = allStates.filter(state => state.val === val);
    if (state[0].data.length)
      console.log(getRate(val, state[0].data[0].count));
    console.log(state);
  };

  function addCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  console.log(allStates);
  console.log(timeSeries);

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
              {highlightBox === colors[i] ? 
              <div style={{ backgroundColor: colors[i], padding: "0.5vw", outline: "3px solid red" }} key={i}></div>
              :
              <div style={{ backgroundColor: colors[i], padding: "0.5vw" }} key={i}></div>}
              <p style={{fontSize: "0.6vw", marginLeft: "1vw"}}>{low}% - {high}%</p>
            </div>
          )}
        )}
        <div style={{display: "flex", marginTop: "1vw"}}>
          {highlightBox === "#A9A9A9" ? 
          <div style={{ backgroundColor: "#A9A9A9", padding: "0.5vw", outline: "3px solid red" }}></div>
          :
          <div style={{ backgroundColor: "#A9A9A9", padding: "0.5vw" }}></div>}
          <p style={{fontSize: "0.6vw", marginLeft: "1vw"}}>No Data Available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{display: "flex", marginLeft: isMobile? "6%" : "", justifyContent: "center"}}>
        <p>Total Count: <b>{addCommas(cumalativeSum)}</b></p>
        <p style={{paddingLeft: "1vw"}}>% of US Population: <b>{(cumalativeSum / USPopulation * 100).toFixed(4)}%</b></p>
      </div>
      <div style={{display: "flex",  justifyContent: "center"}}>
        <div style={{width: "75%"}}>
        <ComposableMap data-tip="" projection="geoAlbersUsa">
          <Geographies geography={geoUrl}>
          {({ geographies }) => (
            <>
              {geographies.map(geo => {
                const cur = allStates.find(s => s.val === geo.id);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={cur && cur.data[0] ? colorScale(getRate(cur.val, cur.data[0].count)) : "#A9A9A9"}
                    onClick={handleClick(geo.id)}
                    onMouseEnter={() => {
                      let state = allStates.filter(state => state.val === geo.id);
                      let toolContent = <p>{state_names[state[0].id] + ": N/A"}</p> 
                      if (state[0].data.length)
                        toolContent = 
                          <div>
                            <u>{state_names[state[0].id]}</u>
                            <p>{"Count: " + addCommas(state[0].data[0].count)}</p>
                            <p>{"% of state population: " + getRate(geo.id, state[0].data[0].count).toFixed(4) +"%"}</p>
                          </div>;
                      props.setTooltipContent(toolContent);
                      setHighlightBox(cur && cur.data[0] ? colorScale(getRate(cur.val, cur.data[0].count)) : "#A9A9A9");
                    }}
                    onMouseLeave={() => {
                      props.setTooltipContent("");
                      setHighlightBox("");
                    }}
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
    <Time selectDate={setSelectedTime}/>
    </div>
  );
};

export default Map;


  /*function filterLatest(){
    let latest = [];
    props.data.forEach(field => {
        let newData = [];
        field.data.forEach(row => {
            newData.push({...row, data: row.data.slice(row.data.length - 1)});
        });
        latest.push({...field, data: newData});
    });
    return latest;
  }*/

  /*function setDateRange(states) {
    let dates = [];
    states.forEach(state => {
      state.data.forEach(data => dates.push(new Date(data.date)));
    });
    let maxDate = new Date(Math.max.apply(null,dates));
    let minDate = new Date(Math.min.apply(null,dates));
    setStartDate(minDate);
    setEndDate(maxDate);
  }*/
