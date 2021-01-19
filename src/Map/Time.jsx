import { Component } from 'react';
import { Slider, Rail, Handles, Tracks, Ticks } from "react-compound-slider";
import { SliderRail, Handle, Track, Tick } from "./components"; // example render components - source below
import { startOfToday, format } from "date-fns";
import { scaleTime } from "d3-scale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const sliderStyle = {
  position: "relative",
  width: "100%"
};

function formatTick(ms) {
  return format(new Date(ms), "MMM dd");
}

const timeStep = 1000 * 60 * 1440;

export default class Time extends Component {
  constructor(props) {
    super(props);

    const today = startOfToday();

    this.state = {
      selected: new Date("12/14/2020"),
      min: new Date("12/14/2020"),
      max: today
    };
  }

  startSelect = (date) => {
      this.setState({
        min : date
      });
  }

  endSelect = (date) => {
    this.setState({
        max : date
    });
  }

  onChange = ([ms]) => {
    this.setState({
        selected: new Date(ms)
    });
    this.props.selectDate(format(new Date(ms), "MM/dd/yyyy"));
  };

  renderDateTime(date, header) {
    return (
      <div
        style={{
          width: "100%",
          textAlign: "center",
          fontFamily: "Arial",
          margin: 5
        }}
      >
        <div style={{paddingBottom: "1em", display: "flex", justifyContent: "center"}}>
            <label style={{padding: "0.1em"}}>Start Date: </label>
            <DatePicker
                selected={this.state.min}
                onSelect={this.startSelect} //when day is clicked
            // onChange={handleDateChange} //only when value has changed
            />
            <label style={{padding: "0.1em", marginLeft: "2em"}}>End Date: </label>
            <DatePicker
                selected={this.state.max}
                onSelect={this.endSelect} //when day is clicked
            // onChange={handleDateChange} //only when value has changed
            />
        </div>
        <div style={{ fontSize: 15 }}>Date Selected: <b>{format(date, "MM/dd/yyyy")}</b></div>
      </div>
    );
  }

  render() {
    const { min, max, selected } = this.state;

    const days = parseInt((max - min) / (1000 * 60 * 60 * 24), 10);

    const dateTicks = scaleTime()
      .domain([min, max])
      .ticks(days > 50? 10 : days)
      .map((d) => +d);

    return (
      <div>
        
        {this.renderDateTime(selected, "Selected")}
        <div style={{ margin: "5%", height: 120, width: "90%" }}>
          <Slider
            mode={1}
            step={timeStep}
            domain={[+min, +max]}
            rootStyle={sliderStyle}
            onChange={this.onChange}
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
      </div>
    );
  }
}
