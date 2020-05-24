import React, { useEffect, useState } from 'react';
import { inject, observer } from 'mobx-react';
import usePending from 'lib/HookState/usePending';
import PetitionDetailTemplate from 'components/PetitionDetail/PetitionDetailTemplate';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import SideAllowedPetitionItem from 'components/PetitionDetail/SideAllowedPetitionItem/SideAllowedPetitionItem';
import GroupingState from 'lib/HookState/GroupingState';
import TokenVerification from 'lib/Token/TokenVerification';

const PetitionDetailContainer = ({ store, history }) => {
  const { getPetitionDetail, PetitionDetailData, writePetitionComment, getPetitionFeed, allowedPetitions} = store.petitionStore;
  const { deletePeition } = store.adminStore;
  const { modal } = store.dialog;
  const [detailData, setDetailData] = useState({});
  const [commentContents, setCommentContents] = useState('');
  const [sideAllowedPetition, setSideAllowedPetition] = useState([]);

  const idx = localStorage.getItem("petition-idx");

  const handlePetitionDetail = async () => {
    await getPetitionDetail(idx);
  };

  const handlePetitionDelete = async (idx) => {
    await deletePeition(idx)
  };

  const handleWritePagePath = async () => {
    const token = TokenVerification() === 'localT' ? localStorage.getItem('petition-token') : sessionStorage.getItem('petition-token'); 

    if (token === null) {
      await modal({
        title: 'Warning!',
        stateType: 'warning',
        contents: '로그인 후 이용해 주세요.'
      });

      return;
    }

    history.push('/petition-write');
  };

  const handleSideAllowedPetition = async () => {
    await getPetitionFeed(1, 5, 'allowed');
  };

  const handleWriteComment = async (petitionIdx) => {
    const token = TokenVerification() === 'localT' ? localStorage.getItem('petition-token') : sessionStorage.getItem('petition-token'); 
    
    if (token === null) {
      await modal({
        title: 'Warning!',
        stateType: 'warning',
        contents: '로그인 후 이용해 주세요.'
      });

      return;
    }
    
      
    if (commentContents.length === 0) {
      await modal({
        title: 'Warning!',
        stateType: 'warning',
        contents: '댓글을 작성 해주세요.'
      });

      return;
    }

    if (commentContents !== '동의 합니다' && commentContents !== '동의 합니다.') {
      await modal({
        title: 'Warning!',
        stateType: 'warning',
        contents: '동의 내용은 "동의 합니다."의 문장만 허용 됩니다.'
      });

      return;
    }

    let data = {
      petitionIdx,
      contents: commentContents,
    };

    await writePetitionComment(data).
      then((response) => {
        modal({
          title: 'Success!',
          stateType: 'success',
          contents: '댓글을 작성 성공!'
        });
  
        return;
      })
      .catch((error) => {
        const { status } = error.response;

        if (status === 400) {
          modal({
            title: 'Warning!',
            stateType: 'warning',
            contents: '양식이 맞지 않습니다.'
          });
    
          return;
        }

        if (status === 403) {
          modal({
            title: 'Warning!',
            stateType: 'warning',
            contents: '이미 동의한 청원 입니다.'
          });
    
          return;
        }

        if (status === 405) {
          modal({
            title: 'Warning!',
            stateType: 'warning',
            contents: '이미 승인 처리 된 청원 입니다.'
          });
    
          return;
        }


        if (status === 500) {
          modal({
            title: 'Error!',
            stateType: 'error',
            contents: '서버 에러! 조금만 기다려 주세요. (__)'
          });

          return;
        }

      });
  };

  const [isLoading, getData] = usePending(handlePetitionDetail);
  const [isLoadingSideAllowedPeition, getSideAllowedPetition] =usePending(handleSideAllowedPetition);
  
  useEffect(() => {
    getData();
    getSideAllowedPetition();
    window.scrollTo(0, 0);
  }, [idx]);

  useEffect(() => {
    setDetailData(PetitionDetailData);
  }, [PetitionDetailData]);

  useEffect(() => {
    if (allowedPetitions) {
      let itemList = [];
      for (let i = 0; i <allowedPetitions.length; i ++) {
        itemList.push(<SideAllowedPetitionItem key={allowedPetitions[i].idx} count={i} item={allowedPetitions[i]}/>);
      }
      setSideAllowedPetition(itemList);
    }
  }, [allowedPetitions]);

  return (
    <PetitionDetailTemplate
      detailData={detailData}
      commentContentsObj = {GroupingState('commentContents', commentContents, setCommentContents)}
      handleWriteCommentFunc = {handleWriteComment}
      handlePetitionDelete={handlePetitionDelete}
      handleWritePagePath={handleWritePagePath}
      sideAllowedPetition={sideAllowedPetition}
    />
  );
};

PetitionDetailContainer.propTypes = {
  store: PropTypes.any,
  history: PropTypes.any
};

export default inject('store')(observer(withRouter(PetitionDetailContainer)));