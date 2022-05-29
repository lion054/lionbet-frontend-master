import React, { ChangeEvent, Fragment, FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Avatar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
  Toolbar,
  Typography
} from '@mui/material';
import { BookmarkBorder, CheckCircle, Close, Settings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

import {
  provider,
  SportEvent,
  getSportImageUrl,
  getSportType,
  bigNumberToTime
} from '../helpers';

import Bet from '../contracts/Bet.json';
import BetOracle from '../contracts/BetOracle.json';

interface BettedPayload {
  chosenWinner: number;
  amount: ethers.BigNumber;
}

const Home: FunctionComponent = () => {
  const navigate = useNavigate();

  const [bettableEvents, setBettableEvents] = useState<SportEvent[]>([]);
  const [bettedEvents, setBettedEvents] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [chosenWinner, setChosenWinner] = useState("");
  const [amount, setAmount] = useState("");
  const [isNew, setIsNew] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [backdropVisible, setBackdropVisible] = useState(false);

  const fetchBettableEvents = async () => {
    const bet = new ethers.Contract(Bet.address, Bet.abi, provider);
    const bettableEventIds = await bet.getBettableEvents();
    const result: SportEvent[] = [];
    for (let i = 0; i < bettableEventIds.length; i++) {
      const evt = await bet.getEvent(bettableEventIds[i]);
      result.push({
        id: evt.id,
        name: evt.name,
        participants: evt.participants,
        participantCount: evt.participantCount,
        date: evt.date,
        kind: evt.kind
      });
    }
    console.log('result', result);
    setBettableEvents(result);
  };

  const fetchBettedEvents = async () => {
    const bet = new ethers.Contract(Bet.address, Bet.abi, provider);
    const bettedEventIds = await bet.getBettedEvents();
    setBettedEvents(bettedEventIds);
  };

  useEffect(() => {
    fetchBettableEvents();
    fetchBettedEvents();

    const onCreatedFilter = {
      address: BetOracle.address,
      topics: [
        ethers.utils.id('SportEventAdded(bytes32,string,string,uint8,uint256,uint8,uint8,int8)')
      ]
    };
    const onEventCreated = () => {
      fetchBettableEvents();
    };

    const onBettedFilter = {
      address: Bet.address,
      topics: [
        ethers.utils.id('BetPlaced(bytes32,address,uint8,uint256)')
      ]
    };
    const onEventBetted = () => {
      fetchBettedEvents();
      setBackdropVisible(false);
    };

    // subscribe
    provider.on(onCreatedFilter, onEventCreated);
    provider.on(onBettedFilter, onEventBetted);

    // unsubscribe
    return () => {
      provider.removeListener(onCreatedFilter, onEventCreated);
      provider.removeListener(onBettedFilter, onEventBetted);
    };
  }, []);

  const title = useMemo(() => {
    if (currentIndex === -1) {
      return 'Bet to undefined';
    }
    return `Bet to ${bettableEvents[currentIndex].name}`;
  }, [bettableEvents, currentIndex]);

  const homeTeam = useMemo(() => {
    if (currentIndex === -1) {
      return '';
    }
    return bettableEvents[currentIndex].participants.split('|')[0];
  }, [currentIndex, bettableEvents]);

  const awayTeam = useMemo(() => {
    if (currentIndex === -1) {
      return '';
    }
    return bettableEvents[currentIndex].participants.split('|')[1];
  }, [currentIndex, bettableEvents]);

  const handleClick = async (index: number) => {
    setCurrentIndex(index);
    setChosenWinner("");
    const eventId = bettableEvents[index].id;
    if (bettedEvents.includes(eventId)) {
      setIsNew(false);
      const bet = new ethers.Contract(Bet.address, Bet.abi, provider);
      const payload: BettedPayload = await bet.getBetPayload(eventId);
      setChosenWinner(payload.chosenWinner.toString());
      setAmount(ethers.utils.formatEther(payload.amount));
    } else {
      setIsNew(true);
      setAmount("0.1");
    }
  };

  const handleClose = () => {
    setCurrentIndex(-1);
  };

  const handleChoose = (e: ChangeEvent<HTMLInputElement>, value: string) => {
    if (isNew) {
      setChosenWinner(value);
    } else {
      e.preventDefault();
    }
  }

  const handleOk = async () => {
    if (chosenWinner === '') {
      setErrorMsg('Please choose the winner.');
      return;
    }
    setBackdropVisible(true);
    const signer = provider.getSigner();
    const bet = new ethers.Contract(Bet.address, Bet.abi, provider);
    try {
      const tx = await bet.connect(signer).placeBet(
        bettableEvents[currentIndex].id,
        parseInt(chosenWinner),
        {
          from: signer.getAddress(),
          value: ethers.utils.parseEther(amount)
        }
      );
      await tx.wait();
    } catch (e: any) {
      console.log(e);
      const rx = /Error: VM Exception while processing transaction: reverted with reason string '(.*)'/g;
      const matched = rx.exec(e.data.message);
      if (matched) {
        setErrorMsg(matched[1]);
      }
      setBackdropVisible(false);
      return;
    }

    setCurrentIndex(-1);
  };

  const handleWithdraw = async () => {
    const signer = provider.getSigner();
    const bet = new ethers.Contract(Bet.address, Bet.abi, provider);
    const eventId = bettableEvents[currentIndex].id;
    const tx = await bet.connect(signer).cancelBet(eventId);
    await tx.wait();
  };

  return (
    <Box
      flexGrow={1}
      sx={{
        backgroundColor: (theme) => theme.palette.background.default
      }}
    >
      <AppBar position="static">
        <Grid container>
          <Grid item md={2} />
          <Grid item md={8} xs={12}>
            <Toolbar>
              <Typography variant="h6" align="center" sx={{ flexGrow: 1 }}>Home</Typography>
              <IconButton color="inherit" onClick={() => navigate('/admin')}>
                <Settings />
              </IconButton>
            </Toolbar>
          </Grid>
          <Grid item md={2} />
        </Grid>
      </AppBar>
      <Grid container>
        <Grid item md={2} />
        <Grid item md={8} xs={12}>
          <List sx={{ mx: 0, my: 1, width: '100%', backgroundColor: 'background.paper' }}>
            {bettableEvents.map((sportEvent, index) => (
              <Fragment key={index}>
                <ListItem button onClick={() => handleClick(index)}>
                  <ListItemAvatar>
                    <Avatar alt={sportEvent.name} src={getSportImageUrl(sportEvent.kind)} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={sportEvent.name}
                    secondary={(
                      <Fragment>
                        <Typography component="span" display="block">{getSportType(sportEvent.kind)}</Typography>
                        <Typography component="span" display="block">{bigNumberToTime(sportEvent.date).toFormat('LLL dd, yyyy')}</Typography>
                      </Fragment>
                    )}
                  />
                </ListItem>
                {(index < bettableEvents.length - 1) && (
                  <Divider variant="inset" component="li" />
                )}
              </Fragment>
            ))}
          </List>
        </Grid>
        <Grid item md={2} />
      </Grid>
      <Dialog
        open={currentIndex !== -1}
        onClose={handleClose}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box component="form">
            <FormControl sx={{ m: 1, width: '100%' }}>
              <FormLabel component="legend">Who is preferred</FormLabel>
              <RadioGroup row value={chosenWinner} onChange={handleChoose}>
                <FormControlLabel value="0" control={<Radio />} label={homeTeam} />
                <FormControlLabel value="1" control={<Radio />} label={awayTeam} />
              </RadioGroup>
            </FormControl>
            <FormControl sx={{ m: 1, width: '100%' }}>
              <TextField
                label="Amount"
                variant="outlined"
                value={amount}
                onChange={(evt) => setAmount(evt.target.value)}
                type="number"
                InputProps={{
                  inputProps: {
                    max: 100,
                    min: 0.1,
                    readOnly: !isNew
                  }
                }}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {isNew ? (
            <Button onClick={handleOk}>OK</Button>
          ) : (
            <Button onClick={handleWithdraw}>Withdraw</Button>
          )}
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg('')}
        message={errorMsg}
        action={(
          <IconButton size="small" color="inherit" onClick={() => setErrorMsg("")}>
            <Close fontSize="small" />
          </IconButton>
        )}
      />
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1
        }}
        open={backdropVisible}
      >
        <CircularProgress color="inherit" size={64} />
      </Backdrop>
    </Box>
  );
}

export default Home;
