import { useState, useEffect } from 'react';
import { Slider, Rail, Handles, Tracks, Ticks } from "react-compound-slider";
import { SliderRail, Handle, Track, Tick } from "./components"; // example render components - source below
import { startOfToday, format } from "date-fns";
import { scaleTime } from "d3-scale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useMediaQuery } from 'react-responsive';

const sliderStyle = {
  position: "relative",
  width: "100%"
};

function formatTick(ms) {
  return format(new Date(ms), "MMM dd");
}

const timeStep = 1000 * 60 * 1440;

export default function Time(props) {

    let UStime = new Date("02/26/2021").toLocaleString("es-PA", {timeZone: "America/Los_Angeles"});
    UStime = UStime.split(" ")[0];
    const today = new Date(UStime);
    const [selected, setSelected] = useState(today);
    const [min, setMin] = useState(new Date("12/14/2020"));
    const [max, setMax] = useState(today);


    const isTablet = useMediaQuery({ query: `(max-width: 1400px)` });
    const isMobile = useMediaQuery({ query: `(max-width: 760px)` });
   

    function onChange([ms]) {
        setSelected(new Date(ms));
        props.selectDate(format(new Date(ms), "MM/dd/yyyy"));
    };

    function renderDateTime(date) {
        return (
        <div
            style={{
            width: "100%",
            textAlign: "center",
            fontFamily: "Arial",
            marginTop: isMobile? "-15%" : ""
            }}
        >
        {isMobile? 
        <div>
             <div style={{ fontSize: 15, paddingBottom: "1em" }}>Date Selected: <b>{format(date, "MM/dd/yyyy")}</b></div>
                <div style={{paddingBottom: "1em", display: "flex", flexDirection: isMobile? "column" : "", justifyContent: "center"}}>
                <label style={{padding: "0.1em"}}>Set Start Date: </label>
                <DatePicker
                    selected={min}
                    onSelect={(date) => setMin(date)} //when day is clicked
                // onChange={handleDateChange} //only when value has changed
                />
                <div style={{paddingTop: "1em"}}></div>
                <label style={{padding: "0.1em"}}>Set End Date: </label>
                <DatePicker
                    selected={max}
                    onSelect={(date) => setMax(date)} //when day is clicked
                // onChange={handleDateChange} //only when value has changed
                />
                </div>
            </div>
            :
            <div>
                <div style={{paddingBottom: "1em", display: "flex", flexDirection: isMobile? "column" : "", justifyContent: "center"}}>
                    <label style={{padding: "0.1em"}}>Set Start Date: </label>
                    <DatePicker
                        selected={min}
                        onSelect={(date) => setMin(date)} //when day is clicked
                    // onChange={handleDateChange} //only when value has changed
                    />
                    <label style={{padding: "0.1em", marginLeft: "2em"}}>Set End Date: </label>
                    <DatePicker
                        selected={max}
                        onSelect={(date) => setMax(date)} //when day is clicked
                    // onChange={handleDateChange} //only when value has changed
                    />
                </div>
                <div style={{ fontSize: 15 }}>Date Selected: <b>{format(date, "MM/dd/yyyy")}</b></div>
            </div>}
        </div>
        );
    }

    const days = parseInt((max - min) / (1000 * 60 * 60 * 24), 10);

    const dateTicks = scaleTime()
      .domain([min, max])
      .ticks(days > 50 || isTablet? 7 : days)
      .map((d) => +d);

    return (
      <div>
        {isMobile? "" : renderDateTime(selected)}
        <div style={{ margin: "5%", height: 120, width: "90%" }}>
          <Slider
            mode={1}
            step={timeStep}
            domain={[+min, +max]}
            rootStyle={sliderStyle}
            onChange={onChange}
            values={[+selected]}
          >
            <Rail>
              {({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}
            </Rail>
            <Handles>
              {({ handles, getHandleProps }) => (
                <div>
                  {handles.map((handle) => (
                    <Handle
                      key={handle.id}
                      handle={handle}
                      domain={[+min, +max]}
                      getHandleProps={getHandleProps}
                    />
                  ))}
                </div>
              )}
            </Handles>
            <Tracks right={false}>
              {({ tracks, getTrackProps }) => (
                <div>
                  {tracks.map(({ id, source, target }) => (
                    <Track
                      key={id}
                      source={source}
                      target={target}
                      getTrackProps={getTrackProps}
                    />
                  ))}
                </div>
              )}
            </Tracks>
            <Ticks values={dateTicks}>
              {({ ticks }) => (
                <div>
                  {ticks.map((tick) => (
                    <Tick
                      key={tick.id}
                      tick={tick}
                      count={ticks.length}
                      format={formatTick}
                    />
                  ))}
                </div>
              )}
            </Ticks>
          </Slider>
        </div>
        {isMobile? renderDateTime(selected) : ""}
      </div>
    );
}
