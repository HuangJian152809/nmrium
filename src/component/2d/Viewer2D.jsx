import React, {
  useCallback,
  Fragment,
  useEffect,
  useState,
  useMemo,
  useReducer,
  // useMemo,
} from 'react';
import { useSize, useDebounce } from 'react-use';

// import XLabelPointer from '../tool/XLabelPointer';
import { BrushTracker } from '../EventsTrackers/BrushTracker';
import { MouseTracker } from '../EventsTrackers/MouseTracker';
import { Chart2DProvider } from '../context/Chart2DContext';
import { useChartData } from '../context/ChartContext';
import { useDispatch } from '../context/DispatchContext';
import { ScaleProvider } from '../context/ScaleContext';
import { useModal } from '../elements/Modal';
import Spinner from '../loader/Spinner';
import MultipletAnalysisModal from '../modal/MultipletAnalysisModal';
import {
  contoursReducer,
  contoursInitialState,
} from '../reducer/ContoursReducer';
import { getXScale, getYScale } from '../reducer/core/scale';
import {
  BRUSH_END,
  FULL_ZOOM_OUT,
  ADD_PEAK,
  SET_VERTICAL_INDICATOR_X_POSITION,
  SET_DIMENSIONS,
  SET_2D_LEVEL,
  SET_ZOOM_FACTOR,
} from '../reducer/types/Types';
import BrushXY, { BRUSH_TYPE } from '../tool/BrushXY';
import CrossLinePointer from '../tool/CrossLinePointer';
import { options } from '../toolbar/ToolTypes';
// import FooterBanner from '../1d/FooterBanner';

import Chart2D from './Chart2D';

function getTrackID(dimension, brushData) {
  for (const key of Object.keys(dimension)) {
    if (
      brushData.startX >= dimension[key].startX &&
      brushData.startX <= dimension[key].endX &&
      brushData.startY >= dimension[key].startY &&
      brushData.startY <= dimension[key].endY
    ) {
      return key;
    }
  }
  return null;
}

const Viewer2D = () => {
  //   const { selectedTool, isLoading, data } = useChartData();
  const state = useChartData();
  const {
    selectedTool,
    isLoading,
    data,
    // mode,
    width: widthProps,
    height: heightProps,
    margin,
    activeSpectrum,
    activeTab,
    tabActiveSpectrum,
  } = state;

  const scaleX = useCallback(
    (spectrumId = null) => getXScale(spectrumId, state),
    [state],
  );

  const scaleY = useMemo(() => {
    return (spectrumId = null, heightProps = null, isReverse = false) =>
      getYScale(spectrumId, heightProps, isReverse, state);
  }, [state]);

  const dispatch = useDispatch();
  const modal = useModal();
  const [state2D, dispatch2D] = useReducer(
    contoursReducer,
    contoursInitialState,
  );

  useEffect(() => {
    dispatch2D({ type: 'initiate', data, tabActiveSpectrum, activeTab });
  }, [activeTab, data, tabActiveSpectrum]);

  // const [dimension, setDimension] = useState();

  const DIMENSION = {
    TOP_1D: {
      startX: margin.left,
      startY: 0,
      endX: widthProps - margin.right,
      endY: margin.top,
    },
    LEFT_1D: {
      startX: 0,
      startY: margin.top,
      endX: margin.left,
      endY: heightProps - margin.bottom,
    },
    CENTER_2D: {
      startX: margin.left,
      startY: margin.top,
      endX: widthProps - margin.right,
      endY: heightProps - margin.bottom,
    },
  };

  const handelBrushEnd = useCallback(
    (brushData) => {
      const trackID = getTrackID(DIMENSION, brushData);
      if (trackID) {
        if (brushData.altKey) {
          switch (selectedTool) {
            case options.rangesPicking.id:
              modal.show(
                <MultipletAnalysisModal
                  data={data}
                  activeSpectrum={activeSpectrum}
                  scaleX={scaleX}
                  {...brushData}
                />,
                {
                  onClose: () => {
                    modal.close();
                  },
                },
              );
              break;
            default:
              break;
          }
        } else if (brushData.shiftKey) {
          switch (selectedTool) {
            default:
              break;
          }
        } else {
          switch (selectedTool) {
            default:
              dispatch({
                type: BRUSH_END,
                ...brushData,
                trackID: getTrackID(DIMENSION, brushData),
              });

              // console.log(getTrackID(DIMENSION, brushData));
              // console.log(DIMENSION);
              // console.log(brushData);
              return;
          }
        }
      }
    },
    [selectedTool, modal, data, activeSpectrum, scaleX, dispatch, DIMENSION],
  );

  const handelOnDoubleClick = useCallback(
    (e) => {
      const { x: startX, y: startY } = e;
      const trackID = getTrackID(DIMENSION, { startX, startY });
      if (trackID) {
        dispatch({ type: FULL_ZOOM_OUT, trackID });
      }
    },
    [DIMENSION, dispatch],
  );

  const handleZoom = (wheelData) => {
    const { x: startX, y: startY } = wheelData;
    const trackID = getTrackID(DIMENSION, { startX, startY });

    if (trackID) {
      if (trackID === 'CENTER_2D') {
        dispatch2D({ type: SET_2D_LEVEL, ...wheelData });
      } else {
        dispatch({ type: SET_ZOOM_FACTOR, ...wheelData, trackID });
      }
    }
  };

  const mouseClick = useCallback(
    (position) => {
      if (selectedTool === options.peakPicking.id) {
        dispatch({
          type: ADD_PEAK,
          mouseCoordinates: position,
        });
      } else if (selectedTool === options.phaseCorrection.id) {
        dispatch({
          type: SET_VERTICAL_INDICATOR_X_POSITION,
          position: position.x,
        });
      }
    },
    [dispatch, selectedTool],
  );

  const [sizedNMRChart, { width, height }] = useSize(() => {
    return (
      <Fragment>
        <Spinner isLoading={isLoading} />

        {data && data.length > 0 && (
          <BrushTracker
            onBrush={handelBrushEnd}
            onDoubleClick={handelOnDoubleClick}
            onClick={mouseClick}
            onZoom={handleZoom}
            style={{
              width: '100%',
              height: '100%',
              margin: 'auto',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <MouseTracker
              style={{ width: '100%', height: `100%`, position: 'absolute' }}
            >
              <CrossLinePointer />
              <BrushXY
                brushType={BRUSH_TYPE.X}
                dimensionBorder={DIMENSION.TOP_1D}
                height={margin.top}
              />
              <BrushXY
                brushType={BRUSH_TYPE.Y}
                dimensionBorder={DIMENSION.LEFT_1D}
                width={margin.left}
              />
              <BrushXY
                brushType={BRUSH_TYPE.XY}
                dimensionBorder={DIMENSION.CENTER_2D}
              />
              <Chart2D />
            </MouseTracker>
          </BrushTracker>
        )}
      </Fragment>
    );
  }, []);

  const [finalSize, setFinalSize] = useState();
  useDebounce(() => setFinalSize({ width, height }), 400, [width, height]);
  useEffect(() => {
    if (
      finalSize &&
      finalSize.width !== Infinity &&
      finalSize.height !== Infinity
    ) {
      dispatch({
        type: SET_DIMENSIONS,
        ...finalSize,
      });
    }
  }, [dispatch, finalSize]);

  return (
    <ScaleProvider value={{ scaleX, scaleY }}>
      <Chart2DProvider value={state2D}>{sizedNMRChart}</Chart2DProvider>
    </ScaleProvider>
  );
};

export default Viewer2D;