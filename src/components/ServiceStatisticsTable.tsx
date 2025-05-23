import { 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  TableContainer,
  Paper
} from '@mui/material';
import { withStyles, createStyles} from '@mui/styles';
import {TStatistics} from "../entities/TStatistics";

const StyledTableCell = withStyles(() =>
  createStyles({
    head: {
      backgroundColor: 'black',
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    body: {
      fontSize: 14,
      textAlign: 'right',
      borderRight: '0.5px solid black'
    },
  }),
)(TableCell);      

const StyledTableRow = withStyles(() =>
  createStyles({
    root: {
      '&:nth-of-type(odd)': {
        backgroundColor: '#F5F5F5',
        color: 'black',
      },
    },
  }),
)(TableRow);

export default function ServiceStatisticsTable({ servicesStatistics }: TStatistics) {
  return (
    <TableContainer component={Paper} style={{ minHeight: 300,maxHeight: 300, overflowY: 'auto',marginTop: 20  }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <StyledTableCell>Services Name</StyledTableCell>
            <StyledTableCell>Average latency</StyledTableCell>
            <StyledTableCell>Request Errors Rate</StyledTableCell>
            <StyledTableCell>Server Error Rate</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {servicesStatistics.length === 0 ? (
          <StyledTableRow>
            <StyledTableCell colSpan={4} style={{ textAlign: 'center' }}>There is no historical statistical data available for the selected time range.</StyledTableCell>
          </StyledTableRow>
        ):(
          servicesStatistics.map((item) => (
            <StyledTableRow key={item.uniqueServiceName+item.name}>
              <StyledTableCell>{item.name}</StyledTableCell>
              <StyledTableCell>{item.latencyMean.toFixed(2)} ms</StyledTableCell>
              <StyledTableCell>{(item.requestErrorsRate * 100).toFixed(2)} %</StyledTableCell>
              <StyledTableCell>{(item.serverErrorRate * 100).toFixed(2)} %</StyledTableCell>
            </StyledTableRow>
          ))
        )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}