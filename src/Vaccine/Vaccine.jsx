import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import Map from '../Map/Map';
import states from '../Map/states.json';

export default function Vaccine() {

    const url = "https://raw.githubusercontent.com/govex/COVID-19/master/data_tables/vaccine_data/raw_data/vaccine_data_us_state_timeline.csv";

    const [allData, setAllData] = useState([]); //in time series
    
    function transformData(raw){
        let results = [];
        for (const [key, _] of Object.entries(raw.data[0])) {
            let field = {};
            field["title"] = key;
            field["data"] = [];
            results.push(field);
        }
        // filter empty data for each key

        for (let i = 4; i < results.length; i++){
            raw.data.forEach(field => {
                if (field[results[i].title] !== "" && field[results[i].title] !== undefined
                 && field[results[i].title] !== " "){
                    results[i].data.push([field["date"], field["stabbr"], field[results[i].title]]);
                }
            })
        }
        let valid_results = results.slice(4);
        console.log(valid_results);
        getDataByState(valid_results);
    }

    useEffect(() => {
        async function fetchCSV(){
            const csv = await axios.get(url).then(response => 
                Papa.parse(response.data,
                          { header: true }));
            transformData(csv);
        }
        fetchCSV();
    }, []);

    function filterState(raw, state){
        let latest = [];
        raw.forEach(row => {
            let field = {};
            field["title"] = row.title;
            field["data"] = [];
            latest.push(field);
        });
        latest.forEach((field, i) => {
            field.data = raw[i].data.filter(data => data[1] === state);
        });
        return latest;
    };

    function getDataByState(data){
        let latest_all = [];
        states.forEach(state => {
            latest_all.push({"id" : state.id, "val" : state.val, data : filterState(data, state.id)});
        });
        setAllData(latest_all);
    }

    console.log(allData);
    return ( 
        <div style={{width: "80%"}}>
        <Map data={allData}/>
        </div>
    );
}