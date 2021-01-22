import React, { useRef } from 'react'
import {
  Hero, ScrollDownIndicator
} from 'react-landing-page';
import Vaccine from './Vaccine/Vaccine';
import heroImage from './media/vaccine.png';
import linkedin from './media/linkedin.png';
import github from './media/github.png';
import portfolio from './media/portfolio.png'
import { useMediaQuery } from 'react-responsive';
 
export default function Home() {
    const myRef = useRef(null);
    const executeScroll = () => myRef.current.scrollIntoView({ behavior: "smooth" });
    const isMobile = useMediaQuery({ query: `(max-width: 760px)` });
    return (
        <div>
            <Hero
            color="white"
            backgroundImage={heroImage}
            >
                <h1 style={{fontSize: isMobile? "2em" : "5em", fontWeight: "lighter", textAlign: "center"}}>COVID-19 Vaccine Tracker</h1>
                <h3 style={{fontWeight: "lighter"}}>Source: John Hopkins University  <a style = {{color: "white"}}
                href="https://github.com/govex/COVID-19/tree/master/data_tables/vaccine_data/raw_data" target="_blank">
                (Data)</a>
                <br />
                Web development: Tanmay Kumar 
                </h3>
                <br />
                <i>Updated Daily</i>

                <ScrollDownIndicator style={{cursor: "pointer"}} onClick={executeScroll}/>
            </Hero>
            <div style={{marginTop: "2em"}} ref={myRef}>
                <Vaccine  />
            </div>
            <footer style={{ display: "flex", justifyContent: "center", 
            color: "white", textAlign: "center", background: "black", flexShrink: "0", padding: "20px"}} class="footer">
                <div style={{marginLeft: "-1vw"}}>
                    <a href="https://www.linkedin.com/in/tkumar01/" target="_blank">
                    <img style={{paddingRight: "1em"}} width={"30em"} src={linkedin} alt="linkedin" /> 
                    </a>
                    <a href="https://portfolio-tanmay.herokuapp.com/" target="_blank">
                    <img style={{paddingRight: "1em"}} width={"30em"} src={portfolio} alt="portfolio" /> 
                    </a>
                    <a href="https://github.com/reclusivestar/vaccine_tracker" target="_blank">
                    <img width={"30em"} src={github} alt="github" /> 
                    </a>
                    <div style={{fontWeight: "lighter"}}>
                    <p>Contact: tanmaysk1@gmail.com</p>
                    <p>Sponsored by: Samuchit Pvt Ltd.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}