import React from "react";
import { Component } from "react";
import { View, Text } from "react-native";
import { makeAPIRequest, makeAPIRequestBis, flatData } from "./services/RequesterAniList";
import Icon from "react-native-vector-icons/FontAwesome";

type Props = {};

export default class SplashScreen extends React.PureComponent<Props> {
  constructor(props) {
    super(props);
    this.state = {
      trendingAnimeList: [],
      suspectedAnimeList: [],
      finishTrendingRequest: false
    };
    this.handleTrendingAnime = this.handleTrendingAnime.bind(this);
    this.requestAllAnime = this.requestAllAnime.bind(this);
    this.filterDuplicatesAnime = this.filterDuplicatesAnime.bind(this);
    this.handleAnimeSuspected = this.handleAnimeSuspected.bind(this);
  }

  componentDidMount() {
    let trendingQuery = `
        query ($page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
            media (sort: [TRENDING_DESC], type: ANIME) {
              id,
              title {
                  romaji 
                  english
                  native
              },
              episodes,
              status,
              description
          } 
        }
      }
    `;
    let trendingVariables = { page: 1, perPage: 30 };
    makeAPIRequest(trendingQuery, trendingVariables, this.handleTrendingAnime, true);
    
    let myUserName = 'userTest';
    fetch('http://mimashita.im-in.love/animes/'+myUserName)
      .then((response) => response.json())
      .then((json) => {
        this.requestAllAnime(json.animesToUpdate);
      })
      .catch((error) => { console.error(error);});
  }
  
  handleTrendingAnime(trendingAnime) {
    this.setState({
      trendingAnimeList: flatData(trendingAnime),
      finishTrendingRequest: true
    });
  }

  requestAllAnime(animeWatchedList){
    let animes = this.filterDuplicatesAnime(animeWatchedList);
    this.setState({ nbOfAnimeWatched: animes.length});
    animes.map( (anime) => {
      let query = `
          query ($search: String) {
              Media (search: $search, type: ANIME) {
                  id,
                  title {
                      romaji 
                      english
                      native
                  },
                  episodes,
                  status,
                  description
              }
          }
      `;
      let variables = { search: anime.nameAnime };
      makeAPIRequestBis(query, variables, this.handleAnimeSuspected, anime.nEp);
    });
  }
  
  filterDuplicatesAnime(arrayOfAnime){
    return ( arrayOfAnime
      .map(anime => 
        arrayOfAnime.reduce( (acc, otherAnime) => {
          if (anime.nameAnime == otherAnime.nameAnime) {
            return (( acc.nEp > otherAnime.nEp ) ?
              acc : otherAnime) 
          } else {return acc}
        })    
      )
      .map(JSON.stringify) // to compare json object
      .filter( (value, index, self) => 
        self.indexOf(value) == index) // filer duplicates anime
      .map(JSON.parse)) // get it back Array
  }

  handleAnimeSuspected(suspectedAnime, nEp){ 
    let newSuspectedList = [];
    if (this.state.suspectedAnimeList) {
      newSuspectedList = this.state.suspectedAnimeList;
    } 
    let suspectedAnimeWithEp = suspectedAnime.data.Media;
    suspectedAnimeWithEp.episodesSeen = nEp;
    newSuspectedList.push(suspectedAnimeWithEp); 
    this.setState({ suspectedAnimeList: newSuspectedList });
    if(newSuspectedList.length == this.state.nbOfAnimeWatched ){
      while(this.state.trendingAnime == []){
        setTimeout(function(){
          console.log("Waiting trending anime list... ");
        }, 200);
      };
      this.props.endSplashScreen(this.state.trendingAnimeList, newSuspectedList);
    }
  }

  render() {
    return (
      <View>
        <Text>Splash Screen ... </Text>
        <Text>Please wait we are loading the data ... </Text>
      </View>
    );
  }
}
