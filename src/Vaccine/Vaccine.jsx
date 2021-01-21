import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import Map from '../Map/Map';
import states from '../Map/states.json';
import ReactTooltip from 'react-tooltip';
import { useMediaQuery } from 'react-responsive';

export default function Vaccine() {

    const url = "https://raw.githubusercontent.com/govex/COVID-19/master/data_tables/vaccine_data/raw_data/vaccine_data_us_state_timeline.csv";
    const definitions_url = "https://raw.githubusercontent.com/govex/COVID-19/master/data_tables/vaccine_data/raw_data/data_dictionary.csv";

    const [allData, setAllData] = useState([]); //in time series
    const [subject, setSubject] = useState("doses_admin_total");
    const [allTitles, setAllTitles] = useState([]);
    const [allDefinitions, setAllDefinitions] = useState([]);
    const [content, setContent] = useState("");

    const isMobile = useMediaQuery({ query: `(max-width: 760px)` });
    
    function extractTitles(allData) {
        const titles = [];
        allData.forEach(data => {
            titles.push(data.title)
        })
        setAllTitles(titles);
    }

    function formatTitle(title){
        if (title === "people_total")
            return "People Total 1st Dose";

        let newTitle = title.split('_');
        newTitle.map((word, i) => {
            if (word === "alloc")
                newTitle[i] = "allocated";
            if (word === "admin")
                newTitle[i] = "administered";
        })
        newTitle.map((word, i) => {
            newTitle[i] = word[0].toUpperCase() + word.substring(1);
        })
        return newTitle.join(' ');
    }
    
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
        extractTitles(valid_results);
        getDataByState(valid_results);
    }

    function transformDataDefinitions(csv){
        let definitions = [];
        csv.data.forEach(col => {
            definitions.push(col);
        });
        setAllDefinitions(definitions.slice(4, definitions.length - 1));
    }

    useEffect(() => {
        async function fetchCSV(){
            const csv = await axios.get(url).then(response => 
                Papa.parse(response.data,
                          { header: true }));
            transformData(csv);
        }
        async function fetchDefinitions(){
            const csv = await axios.get(definitions_url).then(response => 
                Papa.parse(response.data,
                          { header: true }));
            transformDataDefinitions(csv);
        }
        fetchCSV();
        fetchDefinitions();
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

    function getDefinition() {
        let data = allDefinitions.filter(def => def.column_name === subject)[0];
        if (data)
            return data.definition;
    }

    function chooseSubject(){
        return (
            <div style={{display: "flex", flexDirection: isMobile? "column" : "", justifyContent: "center"}}> 
                <div style={{padding: "1.4vw"}}>
                    <label style={{paddingLeft: isMobile? "5%" : ""}} for="titles">Filter Data: </label>
                    <select name="titles" id="titles" onChange={(e) => setSubject(e.target.value)} value={subject}>
                    {allTitles.map(title => {
                        return(
                            <option value={title}>{formatTitle(title)}</option>
                        )}
                    )}
                    </select>
                </div>
                <div style={{textAlign: isMobile? "center" : ""}}>
                    <h2 style={{fontWeight: "lighter"}}>{getDefinition()}</h2>
                </div>
            </div>
        );
    }

    console.log(allData);
    console.log(subject);
    return ( 
        <div style={{marginLeft: isMobile? "5%" : "18%", width: isMobile? "90%" : "60%"}}>
            {chooseSubject()}
            <Map data={allData} title={subject} setTooltipContent={setContent}/>
            <ReactTooltip>{content}</ReactTooltip>
        </div>
    );
}