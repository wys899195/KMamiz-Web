import {
  Card, FormControlLabel, FormGroup, Switch, Typography,Button,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ViewportUtils from "../../classes/ViewportUtils";
import GraphService from "../../services/GraphService";
import SimulationService from "../../services/SimulationService";
import { DiffDependencyGraphFactory } from "../../classes/DiffDependencyGraphFactory";
import { DependencyGraphUtils } from "../../classes/DependencyGraphUtils";
import { useGraphDifference } from "../../classes/DiffDisplayUtils";

import Loading from "../../components/Loading";
import MonacoEditor from "@monaco-editor/react";

const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

const useStyles = makeStyles(() => ({
  container: {
    display: 'flex',
    height: '100vh',
    flexDirection: 'row',
  },
  switch: {
    position: "absolute",
    top: "4.5em",
    right: "1em",
    paddingLeft: "0.8em",
  },
  editor: {
    width: '45%',
    padding: '10px',
    borderRight: '5px solid #ccc',
    display: 'flex',
    flexDirection: 'column',
    height: '90vh',
  },
  graphContainer: {
    width: '65%',
    padding: '10px',
    overflow: 'auto',
    height: '100%',
  },
  divider: {
    width: '5px',
    cursor: 'ew-resize',
    backgroundColor: '#ddd',
    height: '100%',
  },
  textField: {
    resize: 'none',
    width: '100%',
    overflowY: 'auto',
    height: '80vh',
    border: '1px solid black'
  },
  buttonContainer: {
    marginTop: '16px',
    display: 'flex', 
    justifyContent: 'space-between', 
    width: '100%',
    flexWrap: 'wrap',
  },
  button: {
    textTransform: 'none',
    margin: '0.8px',
  },
}));


export default function Simulation() {
  const classes = useStyles();


  /***window size control***/
  const rwdWidth = 1300
  const [pageSize, setPageSize] = useState([0, 0]);
  const [graphWidthRate, setCanvasWidthRate] = useState(0.5);
  const [graphHeightRate, setCanvasHeightRate] = useState(0.75);
  const [editorWidth, setEditorWidth] = useState(45);
  const [isResizing, setIsResizing] = useState(false);

  const graphDataRef = useRef<any>();
  const rawGraphDataRef = useRef<string>();

  const [showEndpoint, setShowEndpoint] = useState(true);

  const [yamlContent, setYamlContent] = useState('');
  const [editorYamlContent, setEditorYamlContent] = useState(''); // initial value is yamlContent
  const [graphData, setGraphData] = useState<any>();
  const [rawGraphData, setRawGraphData] = useState<any>();
  const [loading, setLoading] = useState(false);

  const [graphDifferenceInfo, setGraphDifferenceInfo] = useGraphDifference();

  const handleParseYamlClick = async () => {
    setYamlContent(editorYamlContent);
  };

  const loadingGraphByYamlContent = async () => {
    if (!yamlContent) {
      return;
    }
    setLoading(true);
    try {
      const { graph, message, resStatus } = await SimulationService.getInstance().getDependencyGraphBySimulateYaml(yamlContent,showEndpoint);
      const nextGraphData = graph;
      if (resStatus >= 400) {
        alert(`Failed to generate dependency graph.\n\n[error message]\n${message}`);
        console.error(`${message}`)
      } else if (nextGraphData) {
        const nextRawGraphData = JSON.stringify(nextGraphData);
        if (rawGraphDataRef.current === nextRawGraphData) return;
        if (!rawGraphDataRef.current) {
          const timer = setInterval(() => {
            if (!graphData) return;
            clearInterval(timer);
            setTimeout(() => {
              graphData.zoom(3, 0);
              graphData.centerAt(0, 0);
            }, 10);
          });
        }
        rawGraphDataRef.current = nextRawGraphData;
        setRawGraphData(JSON.parse(nextRawGraphData));
        setGraphData(DependencyGraphUtils.ProcessData(nextGraphData));
        localStorage.setItem("inityamlInput", yamlContent);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadYamlContentByCurrentDependency = async () => {
    setLoading(true);
    try {
      const endpointGraphData = await GraphService.getInstance().getDependencyGraph(true);
      if (endpointGraphData) {
        const nestYamlContent = await SimulationService.getInstance().getSimulateYamlByEndpointDependencyGraph(endpointGraphData);
        setYamlContent(nestYamlContent);
        setEditorYamlContent(nestYamlContent);
      }
    } catch (error) {
      console.error("Failed to generate simulation YAML from the current dependency graph:", error);
    }finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadingGraphByYamlContent();
  }, [showEndpoint,yamlContent]);


  /***useEffect for window size control***/
  useEffect(() => {
    const unsubscribe = [
      ViewportUtils.getInstance().subscribe(([vw]) => {
        setCanvasWidthRate(vw > rwdWidth ? 0.55 : 0.55);
        setCanvasHeightRate(vw > rwdWidth ? 0.9 : 0.9);
      }),
    ];
    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, []);
  useLayoutEffect(() => {
    const unsubscribe = [
      ViewportUtils.getInstance().subscribe(([vw, vh]) =>
        setPageSize([vw, vh])
      ),
    ];
    return () => {
      unsubscribe.forEach((un) => un());
    };
  }, []);
  useEffect(() => {
    if (graphDataRef.current) {
      graphDataRef.current.zoom(4, 0);
      graphDataRef.current.centerAt(0, 0);
    }

  }, [graphData]);


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className={classes.container}>
      <div
        className={classes.editor}
        style={{ width: `${editorWidth}%` }}
      >

        <MonacoEditor
          className={classes.textField}
          value={yamlContent}
          onChange={(value) => setEditorYamlContent(value || "")}
          language="yaml"
          theme="light"
          height="80vh"
          options={{
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: "on",
            tabSize: 2,
            autoIndent: "advanced",
            formatOnType: true,
            suggestOnTriggerCharacters: true,
          }}
        />
        <div className={classes.buttonContainer}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleParseYamlClick}
            disabled={loading || !editorYamlContent}
            className={classes.button}
          >
            {loading ? 'Loading...' : 'Generate Dependency graph'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={loadYamlContentByCurrentDependency}
            disabled={loading}
            className={classes.button}
          >
            {loading ? 'Loading...' : 'Generate YAML from current dependency graph'}
          </Button>
        </div>
      </div>

      <div
        className={classes.divider}
        onMouseDown={() => setIsResizing(true)}
      ></div>

      <div
        className={classes.graphContainer}
        style={{ width: `${100 - editorWidth}%` }}
      >
        <Typography variant="h5">Dependency Graph</Typography>
        <div className="dependency-graph" id="dependency-graph">
          <Suspense fallback={<Loading />}>
            <ForceGraph2D
              ref={graphDataRef}
              width={pageSize[0] * graphWidthRate - 20}
              height={pageSize[1] * graphHeightRate - 40}
              graphData={graphData}
              {...DiffDependencyGraphFactory.Create(
                graphDifferenceInfo,
                false,
              )}
            />
          </Suspense>
        </div>
      </div>

      <Card className={classes.switch}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={showEndpoint}
                  onChange={(e) => setShowEndpoint(e.target.checked)}
                />
              }
              label="Show endpoints"
            />
          </FormGroup>
        </Card>
    </div>
  );
}