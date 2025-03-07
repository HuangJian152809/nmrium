import { SvgNmrSameTop, SvgNmrResetScale } from 'cheminfo-font';
import { memo, useCallback } from 'react';
import {
  FaCreativeCommonsSamplingPlus,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';

import { Datum1D } from '../../../data/types/data1d';
import { Datum2D } from '../../../data/types/data2d';
import { useChartData } from '../../context/ChartContext';
import { useDispatch } from '../../context/DispatchContext';
import Button from '../../elements/ButtonToolTip';
import { useAlert } from '../../elements/popup/Alert';
import { useModal } from '../../elements/popup/Modal';
import { ActiveSpectrum, useActiveSpectrum } from '../../reducer/Reducer';
import { DISPLAYER_MODE } from '../../reducer/core/Constants';
import {
  ADD_MISSING_PROJECTION,
  CHANGE_VISIBILITY,
  DELETE_SPECTRA,
  RESET_SPECTRA_SCALE,
  SET_SPECTRA_SAME_TOP,
} from '../../reducer/types/Types';
import DefaultPanelHeader from '../header/DefaultPanelHeader';
import { SpectraAutomaticPickingButton } from '../header/SpectraAutomaticPickingButton';

interface SpectraPanelHeaderProps {
  spectrums: Array<Datum1D | Datum2D>;
}

interface SpectraPanelHeaderInnerProps extends SpectraPanelHeaderProps {
  data: Array<Datum1D | Datum2D>;
  activeTab: string;
  activeSpectrum: ActiveSpectrum | null;
  displayerMode: string;
}

function SpectraPanelHeaderInner({
  data,
  activeSpectrum,
  activeTab,
  displayerMode,
  spectrums,
}: SpectraPanelHeaderInnerProps) {
  const modal = useModal();
  const alert = useAlert();
  const dispatch = useDispatch();

  const handleDelete = useCallback(() => {
    modal.showConfirmDialog({
      message: 'All records will be deleted, Are You sure?',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            dispatch({ type: DELETE_SPECTRA });
          },
        },
        { text: 'No' },
      ],
    });
  }, [dispatch, modal]);

  const showAllSpectrumsHandler = useCallback(() => {
    const spectrumsPerTab = spectrums.map((datum) => {
      return datum.id;
    });
    dispatch({ type: CHANGE_VISIBILITY, id: spectrumsPerTab });
  }, [dispatch, spectrums]);

  const hideAllSpectrumsHandler = useCallback(() => {
    dispatch({ type: CHANGE_VISIBILITY, id: [] });
  }, [dispatch]);

  const addMissingProjectionHandler = useCallback(() => {
    function getMissingProjection(SpectrumsData) {
      let nucleus = activeTab.split(',');
      nucleus = nucleus[0] === nucleus[1] ? [nucleus[0]] : nucleus;
      const missingNucleus: Array<string> = [];
      for (const n of nucleus) {
        const hasSpectrums = SpectrumsData.some((d) => d.info.nucleus === n);
        if (!hasSpectrums) {
          missingNucleus.push(n);
        }
      }
      return missingNucleus;
    }
    const missingNucleus = getMissingProjection(data);
    if (missingNucleus.length > 0) {
      dispatch({ type: ADD_MISSING_PROJECTION, nucleus: missingNucleus });
    } else {
      alert.error('Nothing to calculate');
    }
  }, [activeTab, alert, data, dispatch]);

  const setSameTopHandler = useCallback(() => {
    dispatch({ type: SET_SPECTRA_SAME_TOP });
  }, [dispatch]);
  const resetScaleHandler = useCallback(() => {
    dispatch({ type: RESET_SPECTRA_SCALE });
  }, [dispatch]);

  return (
    <DefaultPanelHeader
      onDelete={handleDelete}
      counter={spectrums?.length}
      deleteToolTip="Delete all spectra"
    >
      <Button popupTitle="Hide all spectra" onClick={hideAllSpectrumsHandler}>
        <FaEyeSlash />
      </Button>
      <Button popupTitle="Show all spectra" onClick={showAllSpectrumsHandler}>
        <FaEye />
      </Button>
      {activeSpectrum && activeTab && activeTab.split(',').length > 1 && (
        <Button
          popupTitle="Add missing projection"
          onClick={addMissingProjectionHandler}
        >
          <FaCreativeCommonsSamplingPlus />
        </Button>
      )}
      {displayerMode === DISPLAYER_MODE.DM_1D && spectrums.length > 1 && (
        <>
          <Button popupTitle="Reset Scale" onClick={resetScaleHandler}>
            <SvgNmrResetScale />
          </Button>
          <Button popupTitle="Same Top" onClick={setSameTopHandler}>
            <SvgNmrSameTop />
          </Button>
        </>
      )}
      <SpectraAutomaticPickingButton />
    </DefaultPanelHeader>
  );
}

const MemoizedSpectraPanelHeader = memo(SpectraPanelHeaderInner);

export default function SpectrumsTabs({ spectrums }: SpectraPanelHeaderProps) {
  const {
    data,
    view: {
      spectra: { activeTab },
    },
    displayerMode,
  } = useChartData();
  const activeSpectrum = useActiveSpectrum();
  return (
    <MemoizedSpectraPanelHeader
      {...{
        data,
        activeSpectrum,
        activeTab,
        displayerMode,
        spectrums,
      }}
    />
  );
}
