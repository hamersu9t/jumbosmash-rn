'use strict';

/*
This is the UI file for the Navigator, Nav Bar, and for passing
relevant props to correct pages
*/

import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
  Navigator,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';

import SwipingPage            from "../cards/SwipingPage.js";
import ChatPage               from "../chat/ChatPage.js";
import ConversationPage       from "../chat/ConversationPage.js"
import AuthContainer          from "../login/AuthContainer.js";
// import SignupPage             from "../login/SignupPage.js";
import SettingsPage           from "../settings/SettingsPage.js";
import ProfileCardView        from '../cards/ProfileCardView.js';
import MatchView              from './MatchView.js';
import NotificationBannerView from "./NotificationBannerView.js";
import GlobalStyles           from "../global/GlobalStyles.js";

const PageNames = require("../global/GlobalFunctions").pageNames();

const NAVBAR_HEIGHT = (Platform.OS === 'ios') ? 64 : 64; // TODO: check the android tabbar height
const PAGE_HEIGHT = Dimensions.get('window').height - NAVBAR_HEIGHT;
const PAGE_WIDTH = Dimensions.get('window').width;
const NAVBAR_SELECTOR_WIDTH = PAGE_WIDTH / 4;

class JumboNavigator extends Component {
  constructor(props) {
    super(props);

    this.currentPage = this.props.initialRoute ? this.props.initialRoute.name : PageNames.cardsPage;

    this.state = {
      // WAIT. before you add anything here, remember that this is the UI of the
      // navigator, only add things that pertain to UI
      chatNotifCount: 0,
      hasUnsavedSettings: false,
      showProfile: false,
      showMatchView: false,
      matchedProfile: null, // profile of the person you matched with for MatchView
      selectorBarPan: new Animated.ValueXY({x:0, y:0}),
    };
  }

  componentDidMount() {
    // example notification calling function
    // this.notificationBanner.showWithMessage("test", ()=>{
    //   this.changePage(PageNames.chatPage);
    // });
    //
    // setTimeout(() => {
    //   this.notificationBanner.showWithMessage("next message arrived", ()=>{
    //     this.changePage(PageNames.chatPage);
    //   });
    // }, 2000);

    // this._notifyUserOfMatchWith(this.props.myProfile)
  }

  _animateSelectorBarTo(pageName) {
    let destinationX = 0;
    if (pageName == PageNames.settingsPage) {
      destinationX = - (PAGE_WIDTH - NAVBAR_SELECTOR_WIDTH) / 2;
    } else if (pageName == PageNames.chatPage) {
      destinationX = PAGE_WIDTH - NAVBAR_SELECTOR_WIDTH * 2.5;
    }

    Animated.spring (
      this.state.selectorBarPan,
      {
        toValue: {x: destinationX, y: 0},
        speed: 40,
        bounciness: 7,
      }
    ).start();
  }

  // Public function, changes which page is showing (swiping, settings, etc),
  // This is used to replace the current page with another page, not to push a
  // new page on top of the current one.
  changePage(pageName) {
    this._animateSelectorBarTo(pageName);
    let currentlyOnSettings = this.currentPage == PageNames.settingsPage;
    let leavingSettings = currentlyOnSettings && pageName != PageNames.settingsPage;
    if (leavingSettings && this.state.hasUnsavedSettings) {
      Alert.alert(
        "Leaving unsaved changes",
        "Save your changes with the circular 'save' button at the bottom-right!",
        [{text: "OK", onPress:( ) => {
          this.navigator.replace({name: pageName});
        }}]
      );
    } else {
      this.navigator.replace({name: pageName});;
    }
  }

  // Returns the content that the navigator should show.  Since route.name is "TabBar"
  // by default, it will show the TabBar.  In order to "push" a view on top of this view,
  // You have to give it its own route name and use navigator.push({name: route name})
  _renderNavigatorScene (route, navigator) {
    this.currentPage = route.name;
    if (route.name == PageNames.settingsPage) {
      return (
        <SettingsPage
          {...this.props.myProfile}
          pageHeight={PAGE_HEIGHT}
          navBarHeight={NAVBAR_HEIGHT}
          updateProfile={this.props.updateProfile}
          firebase={this.props.firebase}
          setHasUnsavedSettings={(hasUnsavedSettings) => {this.setState({hasUnsavedSettings})}}
        />
      );
    } else if (route.name == PageNames.cardsPage) {
      return (
        <SwipingPage
          ref={(elem) => {this.swipingPage = elem}}
          navigator={navigator}
          profiles={this.props.profiles}
          myProfile={this.props.myProfile}
          fetchProfiles={this.props.fetchProfiles}
          navBarHeight={NAVBAR_HEIGHT}
          pageHeight={PAGE_HEIGHT}
          removeSeenCards={this.props.removeSeenCards}
          notifyUserOfMatchWith={this._notifyUserOfMatchWith.bind(this)}
          openProfileCard={this._openProfileCard.bind(this)}
        />
      );
    } else if (route.name == PageNames.chatPage) {
      return (
        <ChatPage
          navigator={navigator}
          myProfile={this.props.myProfile}
          navBarHeight={NAVBAR_HEIGHT}
          pageHeight={PAGE_HEIGHT}
        />
      );
    } else if (route.name == PageNames.loginPage) {
      return (
        <AuthContainer
          firebase={this.props.firebase}
        />
      );
    } else if (route.name == PageNames.conversation) {
      return(
        <ConversationPage
          navigator={navigator}
          chatroomId={route.chatroomId}
          participants={route.participants}
          userId={route.userId}
          setCurrentParticipant={this.props.setCurrentParticipant}
          firebase={this.props.firebase}
        />
      );
    }
  }

  _renderNavBarLeftButton(route, navigator, index, navState) {
    if (route.name == PageNames.conversation) {
      return (
        <TouchableOpacity onPress={() => {navigator.pop();}}>
          <Text>Back</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.buttonArea}
          onPress={() => {
            this.changePage(PageNames.settingsPage);
          }}
        >
          <Text>Account</Text>
        </TouchableOpacity>
      );
    }
  }

  _renderNavBarRightButton(route, navigator, index, navState) {
    if (route.name == PageNames.conversation) {
      return null;
    } else {
      return (
        <TouchableOpacity
          style={styles.buttonArea}
          onPress={() => {
            this.changePage(PageNames.chatPage);
          }}
        >
          <Text>Chat</Text>
        </TouchableOpacity>
      );
    }
  }

  _renderNavBarCenter(route, navigator, index, navState) {
    if (route.name == PageNames.conversation) {
      return (
        <View style={styles.navigationBarTitleContainer}>
          <Image style={styles.avatarPhoto} source={this.state.currentParticipant ? {uri: this.state.currentParticipant.photo} : null}/>
          <Text style={styles.navigationBarTitleText}>
            {this.state.currentParticipant ? this.state.currentParticipant.firstName : null}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.buttonArea}>
          <TouchableOpacity onPress={() => {
            this.changePage(PageNames.cardsPage);
          }}>
            <Text>Swipe!</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            this.changePage(PageNames.loginPage);
          }}>
            <Text>Login (temp)</Text>
          </TouchableOpacity>
          <Animated.View style={[styles.navBarSelector, {transform: this.state.selectorBarPan.getTranslateTransform()}]}/>
        </View>
      );
    }
  }

  // returns UI element of the navigation bar
  _renderNavigationBar() {
    return (
      <Navigator.NavigationBar style={[GlobalStyles.basicShadow, styles.navigationBarContainer]}
        routeMapper={{
          LeftButton: this._renderNavBarLeftButton.bind(this),
          RightButton: this._renderNavBarRightButton.bind(this),
          Title: this._renderNavBarCenter.bind(this),
        }}>
      </Navigator.NavigationBar>
    );
  }

  // Profile card UI

  _shouldRenderProfileView() {
    if (this.state.showProfile && this.swipingPage.state.cardIndex < this.props.profiles.length) {
      return(
        <View style={[GlobalStyles.absoluteCover ,styles.coverView]}>
          <ProfileCardView {...this.props.profiles[this.swipingPage.state.cardIndex]}
            pageHeight={PAGE_HEIGHT + NAVBAR_HEIGHT}
            exitFunction={this._closeProfileCard.bind(this)}
          />
        </View>
      );
    }
  }

  _openProfileCard() {
    this.setState({
      showProfile: true,
    })
  }

  _closeProfileCard() {
    this.setState({
      showProfile: false,
    })
  }

  // Match View UI

  _shouldRenderMatchView() {
    if (this.state.showMatchView && this.currentPage == PageNames.cardsPage && this.props.profiles.length > 1) {
      return (
        <View style={[GlobalStyles.absoluteCover, styles.coverView]}>
          <MatchView
            myProfile={this.props.myProfile}
            matchProfile={this.state.matchProfile}
            onClose={() => this.setState({showMatchView: false})}
            onSuccess={() => this.changePage(PageNames.chatPage)}
          />
        </View>
      );
    }
  }

  // shows the correct notification for matching
  // if on the swiping page, then shows full match view, else shows a banner notif
  _notifyUserOfMatchWith(profile) {
    if (profile != null && this.currentPage == PageNames.cardsPage) {
      this.setState({
        matchProfile: profile,
        showMatchView: true,
      });
    } else if (profile != null) {
      this.setState({
        matchProfile: profile,
      });
      this.notificationBanner.showWithMessage("New Match! Say Hello to " + profile.firstName, ()=>{
        this.changePage(PageNames.chatPage);
      });
    }
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <Navigator
          ref={(elem)=>{this.navigator = elem}}
          initialRoute={this.props.initialRoute ? this.props.initialRoute : { name: PageNames.cardsPage }}
          renderScene={this._renderNavigatorScene.bind(this)}
          navigationBar={this._renderNavigationBar()}
        />
        {this._shouldRenderProfileView()}
        {this._shouldRenderMatchView()}
        <NotificationBannerView ref={(elem) => {this.notificationBanner = elem}}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  avatarPhoto: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  navigationBarContainer: {
    backgroundColor: 'white',
  },
  navigationBarTitleContainer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationBarTitleText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#CAC4C4',
    fontFamily: 'Avenir Next',
  },
  coverView: {
    zIndex: 100,
  },
  buttonArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: NAVBAR_SELECTOR_WIDTH,
  },
  navBarSelector: {
    position: 'absolute',
    bottom: 0,
    height: 5,
    width: NAVBAR_SELECTOR_WIDTH,
    backgroundColor: 'black',
  }
});


export default JumboNavigator;